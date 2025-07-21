"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllContacts = exports.toggleBookmark = exports.getContactsByLabel = exports.getContactByName = exports.updateContactById = exports.registerContact = exports.searchContacts = exports.deleteContactById = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const Cloudinary_1 = require("../utils/Cloudinary");
const models_contact_1 = require("../models/models.contact");
const applyPaginationAndSorting = (req_1, ...args_1) => __awaiter(void 0, [req_1, ...args_1], void 0, function* (req, filter = {}) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (isNaN(page) || page <= 0) {
        throw new ApiError_1.ApiError(400, "Page number must be a positive integer.");
    }
    if (isNaN(limit) || limit <= 0) {
        throw new ApiError_1.ApiError(400, "Limit must be a positive integer.");
    }
    const skip = (page - 1) * limit;
    try {
        const totalContacts = yield models_contact_1.Contact.countDocuments(filter);
        const contacts = yield models_contact_1.Contact.find(filter)
            .skip(skip)
            .limit(limit)
            .collation({ locale: "en" })
            .sort({
            bookmarked: -1,
            name: 1
        });
        const totalPages = Math.ceil(totalContacts / limit);
        const finalTotalPages = totalContacts === 0 ? 0 : Math.ceil(totalContacts / limit);
        return {
            contacts,
            currentPage: page,
            totalPages: finalTotalPages,
            totalCount: totalContacts,
            limit,
        };
    }
    catch (error) {
        console.error("Error applying pagination and sorting:", error);
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            throw new ApiError_1.ApiError(500, "Database error during pagination: " + error.message);
        }
        throw new ApiError_1.ApiError(500, "Failed to apply pagination and sorting: " + error.message);
    }
});
const registerContact = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("inside register");
    const { name, phoneNumber, address, label } = req.body;
    if (!name || name.trim() === "") {
        throw new ApiError_1.ApiError(400, "Name is required");
    }
    if (!phoneNumber || phoneNumber.trim() === "") {
        throw new ApiError_1.ApiError(400, "Phone Number is required");
    }
    if (phoneNumber.length !== 10) {
        throw new ApiError_1.ApiError(400, "Phone Number should be exactly of 10 digits");
    }
    const Phone = yield models_contact_1.Contact.findOne({ phoneNumber: phoneNumber });
    if (Phone) {
        throw new ApiError_1.ApiError(400, "User Already Exists with this PhoneNumber");
    }
    const avatarLocalPath = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
    if (!avatarLocalPath) {
        console.error("No file path found in request");
    }
    const avatar = yield (0, Cloudinary_1.uploadOnCloudinary)(avatarLocalPath);
    const contact = yield models_contact_1.Contact.create({
        name,
        avatar: avatar || "",
        phoneNumber,
        address,
        label
    });
    const createdContact = yield models_contact_1.Contact.findById(contact._id);
    if (!createdContact) {
        throw new ApiError_1.ApiError(500, "something went wrong while registering user");
    }
    res.status(201).json(new ApiResponse_1.ApiResponse(201, createdContact, "Contact created successfully"));
}));
exports.registerContact = registerContact;
const updateContactById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { id } = req.params;
    const phoneNumber = (_a = req.body) === null || _a === void 0 ? void 0 : _a.phoneNumber;
    const address = (_b = req.body) === null || _b === void 0 ? void 0 : _b.address;
    const label = (_c = req.body) === null || _c === void 0 ? void 0 : _c.label;
    const newName = (_d = req.body) === null || _d === void 0 ? void 0 : _d.name;
    if (!id || id.trim() === '') {
        throw new ApiError_1.ApiError(400, 'Contact ID is required to update contact');
    }
    const contact = yield models_contact_1.Contact.findById(id);
    if (!contact) {
        throw new ApiError_1.ApiError(404, 'Contact not found with the given ID');
    }
    if (phoneNumber !== undefined && phoneNumber !== null) {
        const parsedPhoneNumber = Number(phoneNumber);
        if (isNaN(parsedPhoneNumber)) {
            throw new ApiError_1.ApiError(400, 'Phone number must be a valid number.');
        }
        if (parsedPhoneNumber !== contact.phoneNumber) {
            const existingContactWithPhoneNumber = yield models_contact_1.Contact.findOne({
                phoneNumber: parsedPhoneNumber,
                _id: { $ne: id }
            });
            if (existingContactWithPhoneNumber) {
                throw new ApiError_1.ApiError(409, 'User Already Exists with this PhoneNumber');
            }
        }
        contact.phoneNumber = parsedPhoneNumber;
    }
    if (address) {
        contact.address = address;
    }
    if (label) {
        contact.label = label;
    }
    if (newName) {
        contact.name = newName;
    }
    const avatarLocalPath = (_e = req.file) === null || _e === void 0 ? void 0 : _e.path;
    if (avatarLocalPath) {
        const avatarUrl = yield (0, Cloudinary_1.uploadOnCloudinary)(avatarLocalPath);
        contact.avatar = avatarUrl;
    }
    yield contact.save();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, contact, 'Contact updated successfully'));
}));
exports.updateContactById = updateContactById;
exports.deleteContactById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id || id.trim() === "") {
        throw new ApiError_1.ApiError(400, "ID is required to delete contact");
    }
    const contact = yield models_contact_1.Contact.findOneAndDelete({ _id: id });
    if (!contact) {
        throw new ApiError_1.ApiError(404, "Contact not found with the given ID");
    }
    res.status(200).json(new ApiResponse_1.ApiResponse(200, {}, "Contact deleted successfully"));
}));
const getContactByName = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.params;
    if (!name || name.trim() === "") {
        throw new ApiError_1.ApiError(400, "Name is required to get the contact");
    }
    const contact = yield models_contact_1.Contact.findOne({ name });
    if (!contact) {
        throw new ApiError_1.ApiError(404, "Contact not found with given name");
    }
    res.status(200).json(new ApiResponse_1.ApiResponse(200, contact, "Contact found successfully"));
}));
exports.getContactByName = getContactByName;
const toggleBookmark = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        throw new ApiError_1.ApiError(400, "Contact ID is required to toggle bookmark");
    }
    const contact = yield models_contact_1.Contact.findById(id);
    if (!contact) {
        throw new ApiError_1.ApiError(404, "Contact not found");
    }
    contact.bookmarked = !contact.bookmarked;
    yield contact.save();
    res.status(200).json(contact);
}));
exports.toggleBookmark = toggleBookmark;
exports.searchContacts = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const searchTerm = req.params.query;
    const label = req.query.label;
    const filter = {};
    const trimmedSearchTerm = searchTerm ? searchTerm.trim() : '';
    if (trimmedSearchTerm !== "") {
        filter.name = { $regex: trimmedSearchTerm, $options: 'i' };
    }
    const trimmedLabel = label ? label.trim().toLowerCase() : '';
    if (trimmedLabel !== "" && trimmedLabel !== 'all') {
        filter.label = label;
    }
    const paginationResult = yield applyPaginationAndSorting(req, filter);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, paginationResult, "Contacts found successfully."));
}));
const getContactsByLabel = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { label } = req.params;
    if (!label || label.trim() === "") {
        throw new ApiError_1.ApiError(400, "Label is required to find contact");
    }
    const filter = { label: label };
    const paginationResult = yield applyPaginationAndSorting(req, filter);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, paginationResult, "Contacts found successfully with the given label"));
}));
exports.getContactsByLabel = getContactsByLabel;
const getAllContacts = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    const paginationResult = yield applyPaginationAndSorting(req, filter);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, paginationResult, "All contacts fetched with pagination and sorting."));
}));
exports.getAllContacts = getAllContacts;
