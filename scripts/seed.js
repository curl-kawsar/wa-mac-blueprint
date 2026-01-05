/**
 * Database Seed Script
 * Creates realistic sample data for development and testing
 * 
 * Usage: npm run seed
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

// Connection string (use environment or default)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/property_management';

// Simple encryption mock for seeding (use real encryption in production)
function mockEncrypt(value) {
    return Buffer.from(value).toString('base64');
}

async function seed() {
    console.log('🌱 Starting database seed...\n');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        const collections = await mongoose.connection.db.collections();
        for (const collection of collections) {
            await collection.deleteMany({});
        }
        console.log('✅ Data cleared\n');

        // Create Users
        console.log('👥 Creating users...');
        const passwordHash = await bcrypt.hash('Password123!', 12);

        const users = await mongoose.connection.db.collection('users').insertMany([
            {
                email: 'admin@propertymanagement.com',
                passwordHash,
                firstName: 'System',
                lastName: 'Administrator',
                phone: '555-100-0001',
                role: 'super_admin',
                status: 'active',
                emailVerified: true,
                refreshTokens: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                email: 'manager@propertymanagement.com',
                passwordHash,
                firstName: 'Sarah',
                lastName: 'Johnson',
                phone: '555-100-0002',
                role: 'property_manager',
                status: 'active',
                emailVerified: true,
                refreshTokens: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                email: 'agent@propertymanagement.com',
                passwordHash,
                firstName: 'Mike',
                lastName: 'Williams',
                phone: '555-100-0003',
                role: 'leasing_agent',
                status: 'active',
                emailVerified: true,
                refreshTokens: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                email: 'accountant@propertymanagement.com',
                passwordHash,
                firstName: 'Emily',
                lastName: 'Chen',
                phone: '555-100-0004',
                role: 'accountant',
                status: 'active',
                emailVerified: true,
                refreshTokens: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                email: 'maintenance@propertymanagement.com',
                passwordHash,
                firstName: 'Bob',
                lastName: 'Martinez',
                phone: '555-100-0005',
                role: 'maintenance_staff',
                status: 'active',
                emailVerified: true,
                refreshTokens: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const adminId = users.insertedIds[0];
        const managerId = users.insertedIds[1];
        console.log(`✅ Created ${users.insertedCount} users\n`);

        // Create Owners
        console.log('🏠 Creating owners...');
        const owners = await mongoose.connection.db.collection('owners').insertMany([
            {
                firstName: 'Robert',
                lastName: 'Anderson',
                email: 'robert.anderson@email.com',
                phone: '555-200-0001',
                address: {
                    street: '123 Owner Lane',
                    city: 'Los Angeles',
                    state: 'CA',
                    zipCode: '90001',
                    country: 'USA',
                },
                taxInfo: {
                    taxIdType: 'ssn',
                    ssnEncrypted: mockEncrypt('123456789'),
                    ssnLast4: '6789',
                },
                bankInfo: {
                    encrypted: mockEncrypt(JSON.stringify({
                        routingNumber: '123456789',
                        accountNumber: '987654321',
                        accountType: 'checking',
                    })),
                    accountLast4: '4321',
                    accountType: 'checking',
                    bankName: 'First National Bank',
                    paymentMethod: 'ach',
                },
                status: 'active',
                contract: {
                    managementFeePercent: 10,
                    startDate: new Date('2024-01-01'),
                },
                preferences: {
                    emailNotifications: true,
                    statementFrequency: 'monthly',
                },
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                firstName: 'Jennifer',
                lastName: 'Smith',
                email: 'jennifer.smith@email.com',
                phone: '555-200-0002',
                address: {
                    street: '456 Investment Ave',
                    city: 'San Francisco',
                    state: 'CA',
                    zipCode: '94102',
                    country: 'USA',
                },
                taxInfo: {
                    taxIdType: 'ssn',
                    ssnEncrypted: mockEncrypt('234567890'),
                    ssnLast4: '7890',
                },
                bankInfo: {
                    encrypted: mockEncrypt(JSON.stringify({
                        routingNumber: '234567890',
                        accountNumber: '876543210',
                        accountType: 'checking',
                    })),
                    accountLast4: '3210',
                    accountType: 'checking',
                    bankName: 'Chase Bank',
                    paymentMethod: 'ach',
                },
                status: 'active',
                contract: {
                    managementFeePercent: 8,
                    startDate: new Date('2024-03-01'),
                },
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const owner1Id = owners.insertedIds[0];
        const owner2Id = owners.insertedIds[1];
        console.log(`✅ Created ${owners.insertedCount} owners\n`);

        // Create Properties
        console.log('🏢 Creating properties...');
        const properties = await mongoose.connection.db.collection('properties').insertMany([
            {
                name: 'Sunset Apartments',
                propertyType: 'multi_family',
                address: {
                    street: '100 Sunset Boulevard',
                    city: 'Los Angeles',
                    state: 'CA',
                    zipCode: '90028',
                    country: 'USA',
                },
                details: {
                    yearBuilt: 1995,
                    squareFeet: 15000,
                    parking: 'garage',
                    parkingSpaces: 20,
                },
                status: 'active',
                managementStatus: 'managed',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'Bay View Condos',
                propertyType: 'condo',
                address: {
                    street: '200 Bay Street',
                    city: 'San Francisco',
                    state: 'CA',
                    zipCode: '94133',
                    country: 'USA',
                },
                details: {
                    yearBuilt: 2010,
                    squareFeet: 8000,
                    parking: 'garage',
                    parkingSpaces: 12,
                },
                status: 'active',
                managementStatus: 'managed',
                hoa: {
                    name: 'Bay View HOA',
                    monthlyDues: 350,
                },
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'Oak Street House',
                propertyType: 'single_family',
                address: {
                    street: '789 Oak Street',
                    city: 'Oakland',
                    state: 'CA',
                    zipCode: '94612',
                    country: 'USA',
                },
                details: {
                    yearBuilt: 1980,
                    squareFeet: 2200,
                    bedrooms: 4,
                    bathrooms: 2.5,
                    parking: 'garage',
                    parkingSpaces: 2,
                },
                status: 'active',
                managementStatus: 'managed',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const property1Id = properties.insertedIds[0];
        const property2Id = properties.insertedIds[1];
        const property3Id = properties.insertedIds[2];
        console.log(`✅ Created ${properties.insertedCount} properties\n`);

        // Create Property Assignments
        console.log('📋 Creating property assignments...');
        await mongoose.connection.db.collection('propertyassignments').insertMany([
            {
                property: property1Id,
                owner: owner1Id,
                ownershipPercent: 100,
                startDate: new Date('2024-01-01'),
                status: 'active',
                isPrimary: true,
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                property: property2Id,
                owner: owner2Id,
                ownershipPercent: 100,
                startDate: new Date('2024-03-01'),
                status: 'active',
                isPrimary: true,
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                property: property3Id,
                owner: owner1Id,
                ownershipPercent: 60,
                startDate: new Date('2024-01-01'),
                status: 'active',
                isPrimary: true,
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                property: property3Id,
                owner: owner2Id,
                ownershipPercent: 40,
                startDate: new Date('2024-01-01'),
                status: 'active',
                isPrimary: false,
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
        console.log('✅ Created property assignments\n');

        // Create Units
        console.log('🚪 Creating units...');
        const units = await mongoose.connection.db.collection('units').insertMany([
            // Sunset Apartments units
            {
                property: property1Id,
                unitNumber: '101',
                unitType: 'apartment',
                details: { bedrooms: 1, bathrooms: 1, squareFeet: 650 },
                rental: { marketRent: 1800, depositAmount: 1800, petsAllowed: true, petDeposit: 500 },
                status: 'occupied',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                property: property1Id,
                unitNumber: '102',
                unitType: 'apartment',
                details: { bedrooms: 1, bathrooms: 1, squareFeet: 680 },
                rental: { marketRent: 1850, depositAmount: 1850, petsAllowed: true },
                status: 'occupied',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                property: property1Id,
                unitNumber: '201',
                unitType: 'apartment',
                details: { bedrooms: 2, bathrooms: 1, squareFeet: 900 },
                rental: { marketRent: 2400, depositAmount: 2400, petsAllowed: true },
                status: 'vacant',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                property: property1Id,
                unitNumber: '202',
                unitType: 'apartment',
                details: { bedrooms: 2, bathrooms: 2, squareFeet: 1000 },
                rental: { marketRent: 2600, depositAmount: 2600, petsAllowed: false },
                status: 'occupied',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // Bay View Condos units
            {
                property: property2Id,
                unitNumber: 'A1',
                unitType: 'apartment',
                details: { bedrooms: 2, bathrooms: 2, squareFeet: 1100 },
                rental: { marketRent: 3500, depositAmount: 3500, petsAllowed: true },
                status: 'occupied',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                property: property2Id,
                unitNumber: 'A2',
                unitType: 'apartment',
                details: { bedrooms: 1, bathrooms: 1, squareFeet: 750 },
                rental: { marketRent: 2800, depositAmount: 2800, petsAllowed: false },
                status: 'vacant',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // Oak Street House (single unit)
            {
                property: property3Id,
                unitNumber: 'MAIN',
                unitType: 'house',
                details: { bedrooms: 4, bathrooms: 2.5, squareFeet: 2200 },
                rental: { marketRent: 4200, depositAmount: 4200, petsAllowed: true, petDeposit: 800 },
                status: 'occupied',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const unit1Id = units.insertedIds[0];
        const unit2Id = units.insertedIds[1];
        const unit4Id = units.insertedIds[3];
        const unit5Id = units.insertedIds[4];
        const unit7Id = units.insertedIds[6];
        console.log(`✅ Created ${units.insertedCount} units\n`);

        // Create Tenants
        console.log('👤 Creating tenants...');
        const tenants = await mongoose.connection.db.collection('tenants').insertMany([
            {
                firstName: 'Alice',
                lastName: 'Brown',
                email: 'alice.brown@email.com',
                phone: '555-300-0001',
                status: 'active',
                currentUnit: unit1Id,
                moveInDate: new Date('2024-02-01'),
                emergencyContacts: [{
                    name: 'Tom Brown',
                    relationship: 'Father',
                    phone: '555-300-0010',
                    isPrimary: true,
                }],
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                firstName: 'David',
                lastName: 'Wilson',
                email: 'david.wilson@email.com',
                phone: '555-300-0002',
                status: 'active',
                currentUnit: unit2Id,
                moveInDate: new Date('2024-01-15'),
                emergencyContacts: [{
                    name: 'Mary Wilson',
                    relationship: 'Mother',
                    phone: '555-300-0020',
                    isPrimary: true,
                }],
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                firstName: 'Emma',
                lastName: 'Davis',
                email: 'emma.davis@email.com',
                phone: '555-300-0003',
                status: 'active',
                currentUnit: unit4Id,
                moveInDate: new Date('2023-11-01'),
                emergencyContacts: [{
                    name: 'John Davis',
                    relationship: 'Husband',
                    phone: '555-300-0030',
                    isPrimary: true,
                }],
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                firstName: 'Chris',
                lastName: 'Taylor',
                email: 'chris.taylor@email.com',
                phone: '555-300-0004',
                status: 'active',
                currentUnit: unit5Id,
                moveInDate: new Date('2024-04-01'),
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                firstName: 'Lisa',
                lastName: 'Garcia',
                email: 'lisa.garcia@email.com',
                phone: '555-300-0005',
                status: 'active',
                currentUnit: unit7Id,
                moveInDate: new Date('2024-03-15'),
                pets: [{
                    type: 'Dog',
                    breed: 'Golden Retriever',
                    name: 'Max',
                    weight: 70,
                }],
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const tenant1Id = tenants.insertedIds[0];
        const tenant2Id = tenants.insertedIds[1];
        const tenant3Id = tenants.insertedIds[2];
        const tenant4Id = tenants.insertedIds[3];
        const tenant5Id = tenants.insertedIds[4];
        console.log(`✅ Created ${tenants.insertedCount} tenants\n`);

        // Create Leases
        console.log('📝 Creating leases...');
        const leases = await mongoose.connection.db.collection('leases').insertMany([
            {
                tenant: tenant1Id,
                property: property1Id,
                unit: unit1Id,
                startDate: new Date('2024-02-01'),
                endDate: new Date('2025-01-31'),
                leaseType: 'fixed',
                status: 'active',
                rent: {
                    monthlyAmount: 1800,
                    dueDay: 1,
                    gracePeriod: 5,
                    lateFeeType: 'flat',
                    lateFeeAmount: 75,
                },
                securityDeposit: {
                    amount: 1800,
                    receivedDate: new Date('2024-01-25'),
                },
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                tenant: tenant2Id,
                property: property1Id,
                unit: unit2Id,
                startDate: new Date('2024-01-15'),
                endDate: new Date('2025-01-14'),
                leaseType: 'fixed',
                status: 'active',
                rent: {
                    monthlyAmount: 1850,
                    dueDay: 15,
                    gracePeriod: 5,
                    lateFeeType: 'flat',
                    lateFeeAmount: 75,
                },
                securityDeposit: {
                    amount: 1850,
                    receivedDate: new Date('2024-01-10'),
                },
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                tenant: tenant3Id,
                property: property1Id,
                unit: unit4Id,
                startDate: new Date('2023-11-01'),
                endDate: new Date('2024-10-31'),
                leaseType: 'fixed',
                status: 'active',
                rent: {
                    monthlyAmount: 2600,
                    dueDay: 1,
                    gracePeriod: 5,
                    lateFeeType: 'flat',
                    lateFeeAmount: 100,
                },
                securityDeposit: {
                    amount: 2600,
                    receivedDate: new Date('2023-10-25'),
                },
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                tenant: tenant4Id,
                property: property2Id,
                unit: unit5Id,
                startDate: new Date('2024-04-01'),
                endDate: new Date('2025-03-31'),
                leaseType: 'fixed',
                status: 'active',
                rent: {
                    monthlyAmount: 3500,
                    dueDay: 1,
                    gracePeriod: 5,
                    lateFeeType: 'flat',
                    lateFeeAmount: 150,
                },
                securityDeposit: {
                    amount: 3500,
                    receivedDate: new Date('2024-03-25'),
                },
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                tenant: tenant5Id,
                property: property3Id,
                unit: unit7Id,
                startDate: new Date('2024-03-15'),
                endDate: new Date('2025-03-14'),
                leaseType: 'fixed',
                status: 'active',
                rent: {
                    monthlyAmount: 4200,
                    dueDay: 15,
                    gracePeriod: 5,
                    lateFeeType: 'flat',
                    lateFeeAmount: 175,
                },
                securityDeposit: {
                    amount: 4200,
                    receivedDate: new Date('2024-03-10'),
                },
                petDeposit: 800,
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
        console.log(`✅ Created ${leases.insertedCount} leases\n`);

        // Create sample ledger entries
        console.log('💰 Creating ledger entries...');
        const ledgerEntries = [];
        const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];

        // Rent payments for tenant 1
        for (const month of months.slice(1)) { // Starting Feb
            ledgerEntries.push({
                entryNumber: `LE-${month.replace('-', '')}-${String(ledgerEntries.length + 1).padStart(7, '0')}`,
                accountType: 'trust_rent',
                transactionType: 'rent_payment',
                amount: 1800,
                debitCredit: 'credit',
                property: property1Id,
                unit: unit1Id,
                owner: owner1Id,
                tenant: tenant1Id,
                description: `Rent payment for ${month}`,
                effectiveDate: new Date(`${month}-03`),
                postedDate: new Date(`${month}-03`),
                status: 'posted',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Management fees
        for (const month of months.slice(1)) {
            ledgerEntries.push({
                entryNumber: `LE-${month.replace('-', '')}-${String(ledgerEntries.length + 1).padStart(7, '0')}`,
                accountType: 'company_revenue',
                transactionType: 'management_fee',
                amount: 180, // 10% of 1800
                debitCredit: 'credit',
                property: property1Id,
                owner: owner1Id,
                description: `Management fee (10%) for ${month}`,
                effectiveDate: new Date(`${month}-15`),
                postedDate: new Date(`${month}-15`),
                status: 'posted',
                createdBy: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        await mongoose.connection.db.collection('ledgerentries').insertMany(ledgerEntries);
        console.log(`✅ Created ${ledgerEntries.length} ledger entries\n`);

        // Create maintenance requests
        console.log('🔧 Creating maintenance requests...');
        await mongoose.connection.db.collection('maintenancerequests').insertMany([
            {
                requestNumber: 'MR-2024-00001',
                property: property1Id,
                unit: unit1Id,
                tenant: tenant1Id,
                title: 'Leaky faucet in kitchen',
                description: 'The kitchen faucet has been dripping for the past week. It seems to be getting worse.',
                category: 'plumbing',
                priority: 'medium',
                status: 'completed',
                assignedTo: users.insertedIds[4], // Maintenance staff
                completion: {
                    completedAt: new Date('2024-05-20'),
                    completedBy: users.insertedIds[4],
                    resolutionNotes: 'Replaced washer and fixed the leak.',
                },
                costs: {
                    labor: 50,
                    materials: 15,
                    total: 65,
                },
                createdBy: tenant1Id,
                createdAt: new Date('2024-05-15'),
                updatedAt: new Date('2024-05-20'),
            },
            {
                requestNumber: 'MR-2024-00002',
                property: property2Id,
                unit: unit5Id,
                tenant: tenant4Id,
                title: 'AC not cooling properly',
                description: 'The air conditioning unit is running but not cooling the apartment effectively.',
                category: 'hvac',
                priority: 'high',
                status: 'in_progress',
                assignedTo: users.insertedIds[4],
                createdBy: tenant4Id,
                createdAt: new Date('2024-06-10'),
                updatedAt: new Date('2024-06-10'),
            },
        ]);
        console.log('✅ Created maintenance requests\n');

        console.log('🎉 Database seeding complete!\n');
        console.log('='.repeat(50));
        console.log('Login Credentials (all use password: Password123!)');
        console.log('='.repeat(50));
        console.log('Super Admin: admin@propertymanagement.com');
        console.log('Property Manager: manager@propertymanagement.com');
        console.log('Leasing Agent: agent@propertymanagement.com');
        console.log('Accountant: accountant@propertymanagement.com');
        console.log('Maintenance: maintenance@propertymanagement.com');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

seed();
