import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import multer from 'multer';

import Company from '../models/Company.js';
import ContactPerson from '../models/ContactPerson.js';
import Suspect from '../models/Suspect.js';
import User from '../models/User.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `bulk-import-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only .csv files are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('file');

export const bulkImportLeads = (req, res) => {
    upload(req, res, async (multerErr) => {
        if (multerErr) {
            return res.status(400).json({
                success: false,
                message: multerErr.message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please attach a file with key "file".'
            });
        }

        const filePath = req.file.path;
        const results = [];
        const errors = [];
        const summary = {
            createdCompanies: 0,
            createdContacts: 0,
            createdSuspects: 0,
            skipped: 0,
            totalRows: 0
        };

        try {
            const stream = fs.createReadStream(filePath)
                .pipe(csvParser({ trim: true }))
                .on('data', async (row) => {
                    stream.pause();

                    summary.totalRows++;

                    try {
                        const companyEmail = (row.companyEmail || '').trim().toLowerCase();
                        const companyName = (row.companyName || '').trim();

                        if (!companyName || !companyEmail) {
                            throw new Error('Missing required fields: companyName and companyEmail');
                        }
                        let company = await Company.findOne({ companyEmail });

                        if (!company) {
                            company = await Company.create({
                                companyName,
                                ownerName: (row.ownerName || '').trim(),
                                companyEmail,
                                companyWebsite: (row.companyWebsite || '').trim(),
                                companyLinkedin: (row.companyLinkedin || '').trim(),
                                companyCapability: (row.companyCapability || '')
                                    .split(',')
                                    .map(s => s.trim())
                                    .filter(Boolean),
                                companySize: (row.companySize || 'Not specified').trim(),
                                companySource: (row.companySource || 'Other').trim(),
                                companyAddress: (row.companyAddress || 'Not provided').trim(),
                                companyCountry: (row.companyCountry || '').trim(),
                                hasBench: String(row.hasBench || '').toLowerCase() === 'true',
                                resourceFromMarket: String(row.resourceFromMarket || '').toLowerCase() === 'true',
                                comment: (row.comment || '').trim(),
                                createdBy: {
                                    userId: req.user.id,
                                    role: req.user.role
                                },
                                isActive: true
                            });
                            if (['ADMIN', 'USER'].includes(req.user.role)) {
                                const field = req.user.role === 'ADMIN' ? 'assignedAdmins' : 'assignedUsers';
                                if (!company[field]) company[field] = [];
                                company[field].push(req.user.id);
                                await company.save();

                                await User.findByIdAndUpdate(req.user.id, {
                                    $addToSet: { companies: company._id }
                                });
                            }

                            summary.createdCompanies++;
                        }

                        const phone = (row.contactPhone || '').trim();
                        let contact = null;

                        if (row.contactName && phone) {
                            contact = await ContactPerson.findOne({ company: company._id, phone });

                            if (!contact) {
                                contact = await ContactPerson.create({
                                    company: company._id,
                                    companySnapshot: {
                                        companyName: company.companyName,
                                        ownerName: company.ownerName,
                                        companyLinkedin: company.companyLinkedin
                                    },
                                    name: (row.contactName || '').trim(),
                                    email: (row.contactEmail || '').trim(),
                                    professionalEmail: (row.contactProfessionalEmail || '').trim(),
                                    phone,
                                    designation: (row.contactDesignation || '').trim(),
                                    linkedin: (row.contactLinkedin || '').trim(),
                                    contactLocation: (row.contactLocation || '').trim(),
                                    addComment: (row.contactComment || '').trim(),
                                    isActive: true,
                                    createdBy: {
                                        userId: req.user.id,
                                        role: req.user.role
                                    }
                                });
                                summary.createdContacts++;
                            }
                        }

                        if (row.interestLevel || row.nextFollowUpOn || row.suspectBudget) {
                            const year = new Date().getFullYear();
                            const random = Math.random().toString(36).slice(2, 8).toUpperCase();
                            const suspectId = `S-${year}-${random}`;

                            let firstContactedOn = undefined;
                            if (row.firstContactedOn && row.firstContactedOn.trim()) {
                                const dt = new Date(row.firstContactedOn.trim());
                                if (!isNaN(dt.getTime())) firstContactedOn = dt;
                            }

                            let lastFollowedUpOn = undefined;
                            if (row.lastFollowedUpOn && row.lastFollowedUpOn.trim()) {
                                const dt = new Date(row.lastFollowedUpOn.trim());
                                if (!isNaN(dt.getTime())) lastFollowedUpOn = dt;
                            }

                            let nextFollowUpOn = undefined;
                            if (row.nextFollowUpOn && row.nextFollowUpOn.trim()) {
                                const dt = new Date(row.nextFollowUpOn.trim());
                                if (!isNaN(dt.getTime())) nextFollowUpOn = dt;
                            }

                            await Suspect.create({
                                suspectId,
                                company: company._id,

                                contactSnapshots: contact
                                    ? [{
                                        name: contact.name,
                                        email: contact.email,
                                        phone: contact.phone,
                                        designation: contact.designation,
                                        linkedin: contact.linkedin,
                                        contactLocation: contact.contactLocation
                                    }]
                                    : [],

                                contactPersonIds: contact ? [contact._id] : [],

                                currentCompany: (row.suspectCurrentCompany || '').trim(),
                                budget: (row.suspectBudget || '').trim(),

                                firstContactedOn,
                                lastFollowedUpOn,
                                nextFollowUpOn,

                                interestLevel: row.interestLevel?.trim(),
                                remarks: (row.suspectRemarks || '').trim(),

                                suspectSource: (row.suspectSource || 'Other').trim(),
                                status: (row.suspectStatus || 'SUSPECT').trim(),

                                companySnapshot: {
                                    companyName: company.companyName,
                                    companyEmail: company.companyEmail,
                                    companyWebsite: company.companyWebsite,
                                    companyLinkedin: company.companyLinkedin,
                                    companyAddress: company.companyAddress
                                },

                                createdBy: {
                                    userId: req.user.id,
                                    role: req.user.role
                                },

                                isActive: true
                            });
                            summary.createdSuspects++;
                        }
                        results.push({
                            row: summary.totalRows,
                            status: 'success',
                            company: company.companyName,
                            contact: contact?.name || null
                        });
                    } catch (err) {
                        errors.push({
                            row: summary.totalRows,
                            error: err.message,
                        });
                    } finally {
                        stream.resume();
                    }
                })
                .on('end', () => {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    res.status(200).json({
                        success: true,
                        message: 'Bulk import completed',
                        summary,
                        results,
                        errors: errors.length > 0 ? errors : undefined
                    });
                })
                .on('error', (err) => {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    res.status(500).json({
                        success: false,
                        message: 'CSV parsing failed',
                        error: err.message
                    });
                });
        } catch (err) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            res.status(500).json({
                success: false,
                message: 'Server error during import',
                error: err.message
            });
        }
    });
};