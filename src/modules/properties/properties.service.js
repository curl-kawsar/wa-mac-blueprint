import { connectDB } from '@/lib/db/mongoose';
import { getPropertyModel, getUnitModel, getPropertyAssignmentModel } from './properties.model';
import { logAction } from '@/lib/audit/audit.service';

/**
 * Properties Service
 * Handles all property, unit, and assignment operations
 */

// ============================================
// PROPERTY OPERATIONS
// ============================================

/**
 * Create a new property
 */
export async function createProperty(propertyData, actor, context = {}) {
    await connectDB();
    const Property = getPropertyModel();

    const property = new Property({
        ...propertyData,
        createdBy: actor.id,
    });

    await property.save();

    await logAction(
        'property.created',
        actor,
        { type: 'property', id: property._id, name: property.name },
        { after: { address: property.fullAddress, type: property.propertyType } },
        context
    );

    return property.toJSON();
}

/**
 * Get property by ID
 */
export async function getPropertyById(propertyId, options = {}) {
    await connectDB();
    const Property = getPropertyModel();

    let query = Property.findById(propertyId);

    if (options.includeUnits) {
        query = query.populate('unitCount');
    }

    return query.lean();
}

/**
 * List properties with pagination and filters
 */
export async function listProperties(filters = {}, options = {}) {
    await connectDB();
    const Property = getPropertyModel();

    const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = options;

    const query = {};

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.propertyType) {
        query.propertyType = filters.propertyType;
    }

    if (filters.managementStatus) {
        query.managementStatus = filters.managementStatus;
    }

    if (filters.city) {
        query['address.city'] = { $regex: filters.city, $options: 'i' };
    }

    if (filters.state) {
        query['address.state'] = filters.state;
    }

    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: 'i' } },
            { 'address.street': { $regex: filters.search, $options: 'i' } },
            { 'address.city': { $regex: filters.search, $options: 'i' } },
        ];
    }

    const [properties, total] = await Promise.all([
        Property.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Property.countDocuments(query),
    ]);

    return {
        data: properties,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get properties for a specific owner
 */
export async function getPropertiesByOwner(ownerId, options = {}) {
    await connectDB();
    const PropertyAssignment = getPropertyAssignmentModel();
    const Property = getPropertyModel();

    // Get active assignments for this owner
    const assignments = await PropertyAssignment.find({
        owner: ownerId,
        status: 'active',
    }).lean();

    const propertyIds = assignments.map((a) => a.property);

    const properties = await Property.find({
        _id: { $in: propertyIds },
    }).lean();

    // Attach ownership info to each property
    return properties.map((property) => {
        const assignment = assignments.find(
            (a) => a.property.toString() === property._id.toString()
        );
        return {
            ...property,
            ownershipPercent: assignment?.ownershipPercent,
            isPrimary: assignment?.isPrimary,
        };
    });
}

/**
 * Update property
 */
export async function updateProperty(propertyId, updates, actor, context = {}) {
    await connectDB();
    const Property = getPropertyModel();

    const property = await Property.findByIdAndUpdate(
        propertyId,
        {
            $set: {
                ...updates,
                updatedBy: actor.id,
            },
        },
        { new: true, runValidators: true }
    ).lean();

    if (!property) {
        throw new Error('Property not found');
    }

    await logAction(
        'property.updated',
        actor,
        { type: 'property', id: property._id, name: property.name },
        { after: updates },
        context
    );

    return property;
}

/**
 * Delete property (soft delete)
 */
export async function deleteProperty(propertyId, actor, context = {}) {
    await connectDB();
    const Property = getPropertyModel();

    const property = await Property.findByIdAndUpdate(
        propertyId,
        {
            $set: {
                status: 'inactive',
                updatedBy: actor.id,
            },
        },
        { new: true }
    ).lean();

    if (!property) {
        throw new Error('Property not found');
    }

    await logAction(
        'property.deleted',
        actor,
        { type: 'property', id: property._id, name: property.name },
        {},
        context
    );

    return property;
}

/**
 * Add internal note to property
 */
export async function addPropertyNote(propertyId, content, actor) {
    await connectDB();
    const Property = getPropertyModel();

    const property = await Property.findByIdAndUpdate(
        propertyId,
        {
            $push: {
                internalNotes: {
                    content,
                    createdBy: actor.id,
                    createdAt: new Date(),
                },
            },
        },
        { new: true }
    ).lean();

    if (!property) {
        throw new Error('Property not found');
    }

    return property;
}

// ============================================
// UNIT OPERATIONS
// ============================================

/**
 * Create a new unit
 */
export async function createUnit(unitData, actor, context = {}) {
    await connectDB();
    const Unit = getUnitModel();
    const Property = getPropertyModel();

    // Verify property exists
    const property = await Property.findById(unitData.propertyId);
    if (!property) {
        throw new Error('Property not found');
    }

    const unit = new Unit({
        property: unitData.propertyId,
        unitNumber: unitData.unitNumber,
        unitType: unitData.unitType,
        details: unitData.details,
        rental: unitData.rental,
        status: unitData.status || 'vacant',
        availableFrom: unitData.availableFrom ? new Date(unitData.availableFrom) : undefined,
        createdBy: actor.id,
    });

    await unit.save();

    return unit.toJSON();
}

/**
 * Get unit by ID
 */
export async function getUnitById(unitId, options = {}) {
    await connectDB();
    const Unit = getUnitModel();

    let query = Unit.findById(unitId);

    if (options.includeProperty) {
        query = query.populate('property');
    }

    if (options.includeTenant) {
        query = query.populate('currentTenant');
    }

    if (options.includeLease) {
        query = query.populate('currentLease');
    }

    return query.lean();
}

/**
 * List units with pagination and filters
 */
export async function listUnits(filters = {}, options = {}) {
    await connectDB();
    const Unit = getUnitModel();

    const {
        page = 1,
        limit = 20,
        sortBy = 'unitNumber',
        sortOrder = 'asc',
    } = options;

    const query = {};

    if (filters.propertyId) {
        query.property = filters.propertyId;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.unitType) {
        query.unitType = filters.unitType;
    }

    if (filters.minRent !== undefined) {
        query['rental.marketRent'] = { $gte: filters.minRent };
    }

    if (filters.maxRent !== undefined) {
        query['rental.marketRent'] = {
            ...query['rental.marketRent'],
            $lte: filters.maxRent,
        };
    }

    if (filters.bedrooms !== undefined) {
        query['details.bedrooms'] = filters.bedrooms;
    }

    const [units, total] = await Promise.all([
        Unit.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('property', 'name address')
            .lean(),
        Unit.countDocuments(query),
    ]);

    return {
        data: units,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get units for a property
 */
export async function getUnitsByProperty(propertyId) {
    await connectDB();
    const Unit = getUnitModel();

    return Unit.find({ property: propertyId })
        .sort({ unitNumber: 1 })
        .lean();
}

/**
 * Get vacant units
 */
export async function getVacantUnits(filters = {}) {
    await connectDB();
    const Unit = getUnitModel();

    const query = { status: 'vacant' };

    if (filters.propertyId) {
        query.property = filters.propertyId;
    }

    return Unit.find(query)
        .populate('property', 'name address')
        .sort({ 'rental.marketRent': 1 })
        .lean();
}

/**
 * Update unit
 */
export async function updateUnit(unitId, updates, actor, context = {}) {
    await connectDB();
    const Unit = getUnitModel();

    const unit = await Unit.findByIdAndUpdate(
        unitId,
        {
            $set: {
                ...updates,
                updatedBy: actor.id,
            },
        },
        { new: true, runValidators: true }
    ).lean();

    if (!unit) {
        throw new Error('Unit not found');
    }

    return unit;
}

/**
 * Update unit status
 */
export async function updateUnitStatus(unitId, status, actor) {
    await connectDB();
    const Unit = getUnitModel();

    const updateData = {
        status,
        updatedBy: actor.id,
    };

    if (status === 'vacant') {
        updateData.currentLease = null;
        updateData.currentTenant = null;
        updateData.lastVacatedAt = new Date();
    }

    const unit = await Unit.findByIdAndUpdate(
        unitId,
        { $set: updateData },
        { new: true }
    ).lean();

    if (!unit) {
        throw new Error('Unit not found');
    }

    return unit;
}

/**
 * Delete unit
 */
export async function deleteUnit(unitId, actor) {
    await connectDB();
    const Unit = getUnitModel();

    const unit = await Unit.findById(unitId);

    if (!unit) {
        throw new Error('Unit not found');
    }

    if (unit.status === 'occupied') {
        throw new Error('Cannot delete an occupied unit');
    }

    await Unit.findByIdAndDelete(unitId);

    return unit;
}

// ============================================
// PROPERTY ASSIGNMENT OPERATIONS
// ============================================

/**
 * Assign property to owner
 */
export async function assignPropertyToOwner(assignmentData, actor, context = {}) {
    await connectDB();
    const PropertyAssignment = getPropertyAssignmentModel();
    const Property = getPropertyModel();

    // Verify property exists
    const property = await Property.findById(assignmentData.propertyId);
    if (!property) {
        throw new Error('Property not found');
    }

    // Check total ownership doesn't exceed 100%
    const existingAssignments = await PropertyAssignment.find({
        property: assignmentData.propertyId,
        status: 'active',
    });

    const totalOwnership = existingAssignments.reduce(
        (sum, a) => sum + a.ownershipPercent,
        0
    );

    if (totalOwnership + assignmentData.ownershipPercent > 100) {
        throw new Error(
            `Cannot assign ${assignmentData.ownershipPercent}%. ` +
            `Only ${100 - totalOwnership}% available.`
        );
    }

    // If marking as primary, unmark other assignments
    if (assignmentData.isPrimary) {
        await PropertyAssignment.updateMany(
            { property: assignmentData.propertyId, status: 'active' },
            { $set: { isPrimary: false } }
        );
    }

    const assignment = new PropertyAssignment({
        property: assignmentData.propertyId,
        owner: assignmentData.ownerId,
        ownershipPercent: assignmentData.ownershipPercent,
        startDate: assignmentData.startDate ? new Date(assignmentData.startDate) : new Date(),
        endDate: assignmentData.endDate ? new Date(assignmentData.endDate) : undefined,
        isPrimary: assignmentData.isPrimary,
        managementFeeOverride: assignmentData.managementFeeOverride,
        notes: assignmentData.notes,
        status: 'active',
        createdBy: actor.id,
    });

    await assignment.save();

    await logAction(
        'property.assigned',
        actor,
        { type: 'property', id: property._id, name: property.name },
        {
            after: {
                ownerId: assignmentData.ownerId,
                ownershipPercent: assignmentData.ownershipPercent,
            },
        },
        context
    );

    return assignment.toJSON();
}

/**
 * Get assignments for a property
 */
export async function getPropertyAssignments(propertyId, options = {}) {
    await connectDB();
    const PropertyAssignment = getPropertyAssignmentModel();

    const query = { property: propertyId };

    if (options.activeOnly !== false) {
        query.status = 'active';
    }

    return PropertyAssignment.find(query)
        .populate('owner', 'firstName lastName email')
        .sort({ isPrimary: -1, ownershipPercent: -1 })
        .lean();
}

/**
 * Get assignments for an owner
 */
export async function getOwnerAssignments(ownerId, options = {}) {
    await connectDB();
    const PropertyAssignment = getPropertyAssignmentModel();

    const query = { owner: ownerId };

    if (options.activeOnly !== false) {
        query.status = 'active';
    }

    return PropertyAssignment.find(query)
        .populate('property', 'name address status')
        .sort({ startDate: -1 })
        .lean();
}

/**
 * Update assignment
 */
export async function updateAssignment(assignmentId, updates, actor) {
    await connectDB();
    const PropertyAssignment = getPropertyAssignmentModel();

    // If changing ownership percent, validate total
    if (updates.ownershipPercent !== undefined) {
        const assignment = await PropertyAssignment.findById(assignmentId);
        if (!assignment) {
            throw new Error('Assignment not found');
        }

        const otherAssignments = await PropertyAssignment.find({
            property: assignment.property,
            status: 'active',
            _id: { $ne: assignmentId },
        });

        const totalOther = otherAssignments.reduce(
            (sum, a) => sum + a.ownershipPercent,
            0
        );

        if (totalOther + updates.ownershipPercent > 100) {
            throw new Error(
                `Cannot set ownership to ${updates.ownershipPercent}%. ` +
                `Only ${100 - totalOther}% available.`
            );
        }
    }

    const updatedAssignment = await PropertyAssignment.findByIdAndUpdate(
        assignmentId,
        { $set: updates },
        { new: true }
    )
        .populate('owner', 'firstName lastName email')
        .populate('property', 'name address')
        .lean();

    if (!updatedAssignment) {
        throw new Error('Assignment not found');
    }

    return updatedAssignment;
}

/**
 * End assignment
 */
export async function endAssignment(assignmentId, actor, context = {}) {
    await connectDB();
    const PropertyAssignment = getPropertyAssignmentModel();

    const assignment = await PropertyAssignment.findByIdAndUpdate(
        assignmentId,
        {
            $set: {
                status: 'ended',
                endDate: new Date(),
            },
        },
        { new: true }
    ).lean();

    if (!assignment) {
        throw new Error('Assignment not found');
    }

    return assignment;
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get property statistics
 */
export async function getPropertyStats() {
    await connectDB();
    const Property = getPropertyModel();
    const Unit = getUnitModel();

    const [propertyStats, unitStats] = await Promise.all([
        Property.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Unit.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
    ]);

    const result = {
        properties: {
            total: 0,
            active: 0,
            inactive: 0,
            pending: 0,
        },
        units: {
            total: 0,
            vacant: 0,
            occupied: 0,
            maintenance: 0,
        },
    };

    for (const stat of propertyStats) {
        result.properties[stat._id] = stat.count;
        result.properties.total += stat.count;
    }

    for (const stat of unitStats) {
        result.units[stat._id] = stat.count;
        result.units.total += stat.count;
    }

    // Calculate occupancy rate
    if (result.units.total > 0) {
        result.units.occupancyRate = Math.round(
            (result.units.occupied / result.units.total) * 100
        );
    } else {
        result.units.occupancyRate = 0;
    }

    return result;
}

export default {
    // Properties
    createProperty,
    getPropertyById,
    listProperties,
    getPropertiesByOwner,
    updateProperty,
    deleteProperty,
    addPropertyNote,

    // Units
    createUnit,
    getUnitById,
    listUnits,
    getUnitsByProperty,
    getVacantUnits,
    updateUnit,
    updateUnitStatus,
    deleteUnit,

    // Assignments
    assignPropertyToOwner,
    getPropertyAssignments,
    getOwnerAssignments,
    updateAssignment,
    endAssignment,

    // Stats
    getPropertyStats,
};
