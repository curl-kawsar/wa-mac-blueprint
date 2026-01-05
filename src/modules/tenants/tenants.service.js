import { connectDB } from '@/lib/db/mongoose';
import { getTenantApplicationModel, getTenantModel } from './tenants.model';
import { getUnitModel } from '@/modules/properties/properties.model';
import { encryptSSN } from '@/lib/crypto/encryption';
import { logAction } from '@/lib/audit/audit.service';

/**
 * Tenants Service
 * Handles tenant applications and tenant profile management
 */

// ============================================
// APPLICATION OPERATIONS
// ============================================

/**
 * Create a new tenant application
 */
export async function createApplication(applicationData, actor, context = {}) {
    await connectDB();
    const TenantApplication = getTenantApplicationModel();
    const Unit = getUnitModel();

    // Verify unit exists and is available
    const unit = await Unit.findById(applicationData.unitId);
    if (!unit) {
        throw new Error('Unit not found');
    }

    if (unit.status !== 'vacant' && unit.status !== 'reserved') {
        throw new Error('Unit is not available for application');
    }

    const application = new TenantApplication({
        applicant: applicationData.applicant,
        coApplicants: applicationData.coApplicants,
        property: applicationData.propertyId,
        unit: applicationData.unitId,
        desiredMoveInDate: new Date(applicationData.desiredMoveInDate),
        desiredLeaseTerm: applicationData.desiredLeaseTerm,
        currentAddress: applicationData.currentAddress,
        landlordReferences: applicationData.landlordReferences,
        employment: applicationData.employment,
        pets: applicationData.pets,
        vehicles: applicationData.vehicles,
        emergencyContact: applicationData.emergencyContact,
        status: 'draft',
        screening: {
            status: 'pending',
            creditCheck: { status: 'pending' },
            backgroundCheck: { status: 'pending' },
            incomeVerification: { status: 'pending' },
            landlordVerification: { status: 'pending' },
        },
        createdBy: actor?.id,
    });

    await application.save();

    return application.toJSON();
}

/**
 * Get application by ID
 */
export async function getApplicationById(applicationId, options = {}) {
    await connectDB();
    const TenantApplication = getTenantApplicationModel();

    let query = TenantApplication.findById(applicationId);

    if (options.includeProperty) {
        query = query.populate('property', 'name address');
    }

    if (options.includeUnit) {
        query = query.populate('unit', 'unitNumber rental');
    }

    return query.lean();
}

/**
 * List applications with filters
 */
export async function listApplications(filters = {}, options = {}) {
    await connectDB();
    const TenantApplication = getTenantApplicationModel();

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

    if (filters.propertyId) {
        query.property = filters.propertyId;
    }

    if (filters.unitId) {
        query.unit = filters.unitId;
    }

    if (filters.search) {
        query.$or = [
            { 'applicant.email': { $regex: filters.search, $options: 'i' } },
            { 'applicant.firstName': { $regex: filters.search, $options: 'i' } },
            { 'applicant.lastName': { $regex: filters.search, $options: 'i' } },
        ];
    }

    const [applications, total] = await Promise.all([
        TenantApplication.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('property', 'name address')
            .populate('unit', 'unitNumber')
            .lean(),
        TenantApplication.countDocuments(query),
    ]);

    return {
        data: applications,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}

/**
 * Update application
 */
export async function updateApplication(applicationId, updates, actor) {
    await connectDB();
    const TenantApplication = getTenantApplicationModel();

    const application = await TenantApplication.findById(applicationId);

    if (!application) {
        throw new Error('Application not found');
    }

    if (!['draft', 'submitted'].includes(application.status)) {
        throw new Error('Cannot update application in current status');
    }

    // Apply updates
    Object.assign(application, updates);
    application.updatedBy = actor.id;

    await application.save();

    return application.toJSON();
}

/**
 * Submit application
 */
export async function submitApplication(applicationId, actor, context = {}) {
    await connectDB();
    const TenantApplication = getTenantApplicationModel();

    const application = await TenantApplication.findById(applicationId);

    if (!application) {
        throw new Error('Application not found');
    }

    if (application.status !== 'draft') {
        throw new Error('Application has already been submitted');
    }

    application.status = 'submitted';
    application.submittedAt = new Date();
    application.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await application.save();

    return application.toJSON();
}

/**
 * Update screening status
 */
export async function updateScreening(applicationId, screeningUpdate, actor, context = {}) {
    await connectDB();
    const TenantApplication = getTenantApplicationModel();

    const application = await TenantApplication.findById(applicationId);

    if (!application) {
        throw new Error('Application not found');
    }

    if (!['submitted', 'screening'].includes(application.status)) {
        throw new Error('Cannot update screening for application in current status');
    }

    // Update to screening status if still submitted
    if (application.status === 'submitted') {
        application.status = 'screening';
        application.screening.status = 'in_progress';
    }

    // Update specific screening type
    const { type, status, notes, score, incomeToRentRatio } = screeningUpdate;

    application.screening[type] = {
        status,
        completedAt: new Date(),
        notes,
        ...(score !== undefined && { score }),
        ...(incomeToRentRatio !== undefined && { incomeToRentRatio }),
    };

    // Check if all screenings are complete
    const screeningTypes = ['creditCheck', 'backgroundCheck', 'incomeVerification', 'landlordVerification'];
    const allComplete = screeningTypes.every(
        (t) => application.screening[t].status && application.screening[t].status !== 'pending'
    );

    if (allComplete) {
        application.screening.status = 'completed';
    }

    application.updatedBy = actor.id;
    await application.save();

    return application.toJSON();
}

/**
 * Make application decision
 */
export async function makeDecision(applicationId, decision, actor, context = {}) {
    await connectDB();
    const TenantApplication = getTenantApplicationModel();
    const Unit = getUnitModel();

    const application = await TenantApplication.findById(applicationId);

    if (!application) {
        throw new Error('Application not found');
    }

    if (!['submitted', 'screening'].includes(application.status)) {
        throw new Error('Cannot make decision for application in current status');
    }

    application.status = decision.status;
    application.decision = {
        status: decision.status,
        decidedBy: actor.id,
        decidedAt: new Date(),
        reason: decision.reason,
        conditions: decision.conditions,
    };

    application.updatedBy = actor.id;
    await application.save();

    // If approved, reserve the unit
    if (decision.status === 'approved' || decision.status === 'conditionally_approved') {
        await Unit.findByIdAndUpdate(application.unit, {
            status: 'reserved',
        });
    }

    await logAction(
        `application.${decision.status}`,
        actor,
        { type: 'application', id: application._id, name: application.fullName },
        { after: { status: decision.status, reason: decision.reason } },
        context
    );

    return application.toJSON();
}

/**
 * Add note to application
 */
export async function addApplicationNote(applicationId, content, actor) {
    await connectDB();
    const TenantApplication = getTenantApplicationModel();

    const application = await TenantApplication.findByIdAndUpdate(
        applicationId,
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

    if (!application) {
        throw new Error('Application not found');
    }

    return application;
}

// ============================================
// TENANT PROFILE OPERATIONS
// ============================================

/**
 * Create tenant from approved application
 */
export async function createTenantFromApplication(applicationId, moveInDate, actor, context = {}) {
    await connectDB();
    const TenantApplication = getTenantApplicationModel();
    const Tenant = getTenantModel();

    const application = await TenantApplication.findById(applicationId);

    if (!application) {
        throw new Error('Application not found');
    }

    if (!['approved', 'conditionally_approved'].includes(application.status)) {
        throw new Error('Application must be approved to create tenant');
    }

    // Check if tenant already exists for this application
    const existingTenant = await Tenant.findOne({ application: applicationId });
    if (existingTenant) {
        throw new Error('Tenant already created from this application');
    }

    const tenant = new Tenant({
        firstName: application.applicant.firstName,
        lastName: application.applicant.lastName,
        email: application.applicant.email,
        phone: application.applicant.phone,
        dateOfBirth: application.applicant.dateOfBirth,
        application: applicationId,
        emergencyContacts: application.emergencyContact
            ? [{ ...application.emergencyContact, isPrimary: true }]
            : [],
        vehicles: application.vehicles,
        pets: application.pets?.map((p) => ({
            ...p,
            registrationDate: new Date(),
        })),
        status: 'active',
        currentUnit: application.unit,
        moveInDate: new Date(moveInDate),
        createdBy: actor.id,
    });

    await tenant.save();

    return tenant.toJSON();
}

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId, options = {}) {
    await connectDB();
    const Tenant = getTenantModel();

    let query = Tenant.findById(tenantId);

    if (options.includeUnit) {
        query = query.populate('currentUnit');
    }

    if (options.includeLease) {
        query = query.populate('currentLease');
    }

    return query.lean();
}

/**
 * Get tenant by user ID
 */
export async function getTenantByUserId(userId) {
    await connectDB();
    const Tenant = getTenantModel();

    return Tenant.findOne({ userId }).lean();
}

/**
 * List tenants with filters
 */
export async function listTenants(filters = {}, options = {}) {
    await connectDB();
    const Tenant = getTenantModel();

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

    if (filters.search) {
        query.$or = [
            { email: { $regex: filters.search, $options: 'i' } },
            { firstName: { $regex: filters.search, $options: 'i' } },
            { lastName: { $regex: filters.search, $options: 'i' } },
        ];
    }

    const [tenants, total] = await Promise.all([
        Tenant.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('currentUnit', 'unitNumber property')
            .lean(),
        Tenant.countDocuments(query),
    ]);

    return {
        data: tenants,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}

/**
 * Update tenant profile
 */
export async function updateTenant(tenantId, updates, actor) {
    await connectDB();
    const Tenant = getTenantModel();

    const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        {
            $set: {
                ...updates,
                updatedBy: actor.id,
            },
        },
        { new: true, runValidators: true }
    ).lean();

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    return tenant;
}

/**
 * Add emergency contact
 */
export async function addEmergencyContact(tenantId, contact, actor) {
    await connectDB();
    const Tenant = getTenantModel();

    // If marking as primary, unmark others
    if (contact.isPrimary) {
        await Tenant.updateOne(
            { _id: tenantId },
            { $set: { 'emergencyContacts.$[].isPrimary': false } }
        );
    }

    const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        {
            $push: { emergencyContacts: contact },
            $set: { updatedBy: actor.id },
        },
        { new: true }
    ).lean();

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    return tenant;
}

/**
 * Add pet
 */
export async function addPet(tenantId, pet, actor) {
    await connectDB();
    const Tenant = getTenantModel();

    const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        {
            $push: {
                pets: {
                    ...pet,
                    registrationDate: new Date(),
                },
            },
            $set: { updatedBy: actor.id },
        },
        { new: true }
    ).lean();

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    return tenant;
}

/**
 * Add vehicle
 */
export async function addVehicle(tenantId, vehicle, actor) {
    await connectDB();
    const Tenant = getTenantModel();

    const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        {
            $push: { vehicles: vehicle },
            $set: { updatedBy: actor.id },
        },
        { new: true }
    ).lean();

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    return tenant;
}

/**
 * Add occupant
 */
export async function addOccupant(tenantId, occupant, actor) {
    await connectDB();
    const Tenant = getTenantModel();

    const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        {
            $push: { occupants: occupant },
            $set: { updatedBy: actor.id },
        },
        { new: true }
    ).lean();

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    return tenant;
}

/**
 * Link tenant to user account
 */
export async function linkTenantToUser(tenantId, userId, actor) {
    await connectDB();
    const Tenant = getTenantModel();

    const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        {
            $set: {
                userId,
                updatedBy: actor.id,
            },
        },
        { new: true }
    ).lean();

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    return tenant;
}

/**
 * Update tenant status (move out, eviction, etc.)
 */
export async function updateTenantStatus(tenantId, status, moveOutDate, actor, context = {}) {
    await connectDB();
    const Tenant = getTenantModel();

    const updateData = {
        status,
        updatedBy: actor.id,
    };

    if (status === 'moved_out' || status === 'evicted') {
        updateData.moveOutDate = moveOutDate || new Date();
        updateData.currentLease = null;
        updateData.currentUnit = null;
    }

    const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
        { $set: updateData },
        { new: true }
    ).lean();

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    return tenant;
}

/**
 * Add note to tenant
 */
export async function addTenantNote(tenantId, content, actor) {
    await connectDB();
    const Tenant = getTenantModel();

    const tenant = await Tenant.findByIdAndUpdate(
        tenantId,
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

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    return tenant;
}

/**
 * Get tenant statistics
 */
export async function getTenantStats() {
    await connectDB();
    const Tenant = getTenantModel();
    const TenantApplication = getTenantApplicationModel();

    const [tenantStats, applicationStats] = await Promise.all([
        Tenant.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        TenantApplication.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
    ]);

    const result = {
        tenants: { total: 0, active: 0, inactive: 0, moved_out: 0, evicted: 0 },
        applications: {
            total: 0,
            draft: 0,
            submitted: 0,
            screening: 0,
            approved: 0,
            denied: 0,
        },
    };

    for (const stat of tenantStats) {
        result.tenants[stat._id] = stat.count;
        result.tenants.total += stat.count;
    }

    for (const stat of applicationStats) {
        result.applications[stat._id] = stat.count;
        result.applications.total += stat.count;
    }

    return result;
}

export default {
    // Applications
    createApplication,
    getApplicationById,
    listApplications,
    updateApplication,
    submitApplication,
    updateScreening,
    makeDecision,
    addApplicationNote,

    // Tenants
    createTenantFromApplication,
    getTenantById,
    getTenantByUserId,
    listTenants,
    updateTenant,
    addEmergencyContact,
    addPet,
    addVehicle,
    addOccupant,
    linkTenantToUser,
    updateTenantStatus,
    addTenantNote,
    getTenantStats,
};
