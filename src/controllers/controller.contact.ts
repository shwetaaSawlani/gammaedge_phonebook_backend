import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse"
import { uploadOnCloudinary } from "../utils/Cloudinary";
import { Contact } from "../models/models.contact"

const applyPaginationAndSorting = async ( req: Request,filter: any = {} ) => {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (isNaN(page) || page <= 0) {
        throw new ApiError(400, "Page number must be a positive integer.");
    }
    if (isNaN(limit) || limit <= 0) {
        throw new ApiError(400, "Limit must be a positive integer.");
    }
   
    const skip = (page - 1) * limit;

    try {
        const totalContacts = await Contact.countDocuments(filter);
        const contacts = await Contact.find(filter)
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

    } catch (error: any) {
        console.error("Error applying pagination and sorting:", error);
        if (error.name === 'MongooseError' || error.name === 'MongoError') {
             throw new ApiError(500, "Database error during pagination: " + error.message);
        }
        throw new ApiError(500, "Failed to apply pagination and sorting: " + error.message);
       
    }
};
const registerContact = asyncHandler(async (req: Request, res: Response) => {

    console.log("inside register");
    const { name, phoneNumber, address, label } = req.body

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Name is required");
    }

    if (!phoneNumber || phoneNumber.trim() === "") {
        throw new ApiError(400, "Phone Number is required");
    }

    if (phoneNumber.length !== 10) {
        throw new ApiError(400, "Phone Number should be exactly of 10 digits");
    }

    const Phone= await Contact.findOne({phoneNumber:phoneNumber})

    if(Phone){
        throw new ApiError(400, "User Already Exists with this PhoneNumber")
    }

    const avatarLocalPath = req.file?.path as string;


    if (!avatarLocalPath) {
        console.error("No file path found in request");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const contact = await Contact.create({

        name,
        avatar: avatar || "",
        phoneNumber,
        address,
        label

    });



    const createdContact = await Contact.findById(contact._id)

    if (!createdContact) {
        throw new ApiError(500, "something went wrong while registering user")
    }
    res.status(201).json(new ApiResponse(201, createdContact, "Contact created successfully"))

})


const updateContactById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const phoneNumber = req.body?.phoneNumber;
    const address = req.body?.address;
    const label = req.body?.label;
    const newName = req.body?.name; 

 
    if (!id || id.trim() === '') {
        throw new ApiError(400, 'Contact ID is required to update contact');
    }


    const contact = await Contact.findById(id); 

    if (!contact) {
        throw new ApiError(404, 'Contact not found with the given ID');
    }

    if (phoneNumber !== undefined && phoneNumber !== null) { 
     
        const parsedPhoneNumber = Number(phoneNumber);
        if (isNaN(parsedPhoneNumber)) {
            throw new ApiError(400, 'Phone number must be a valid number.');
        }

        if (parsedPhoneNumber !== contact.phoneNumber) {
            const existingContactWithPhoneNumber = await Contact.findOne({
                phoneNumber: parsedPhoneNumber,
                _id: { $ne: id }
            });

            if (existingContactWithPhoneNumber) {
                throw new ApiError(409, 'User Already Exists with this PhoneNumber'); 
            }
        }
        contact.phoneNumber = parsedPhoneNumber;
    }

 
    if (address ) {
        contact.address = address;
    }
    if (label ) {
        contact.label = label;
    }
    if (newName) { 
        contact.name = newName;
    }

   
    const avatarLocalPath = req.file?.path as string;
    if (avatarLocalPath) {
        const avatarUrl = await uploadOnCloudinary(avatarLocalPath);

        contact.avatar = avatarUrl;
    }
    await contact.save();
    res.status(200).json(new ApiResponse(200, contact, 'Contact updated successfully'));
});


export const deleteContactById = asyncHandler(async (req: Request, res: Response) => {
   
    const { id } = req.params;
    if (!id || id.trim() === "") {
        throw new ApiError(400, "ID is required to delete contact");
    }

    const contact = await Contact.findOneAndDelete({ _id: id });

    if (!contact) {
        throw new ApiError(404, "Contact not found with the given ID");
    }
    res.status(200).json(
        new ApiResponse(200, {}, "Contact deleted successfully")
    );
});





const getContactByName = asyncHandler(async (req: Request, res: Response) => {

    const { name } = req.params;

    if (!name || name.trim() === "") {

        throw new ApiError(400, "Name is required to get the contact");
    }

    const contact = await Contact.findOne({ name });

    if (!contact) {
        throw new ApiError(404, "Contact not found with given name");
    }


    res.status(200).json(

        new ApiResponse(200, contact, "Contact found successfully")

    );

})



const toggleBookmark = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Contact ID is required to toggle bookmark");
    }

    const contact = await Contact.findById(id);

    if (!contact) {
        throw new ApiError(404, "Contact not found");
    }

    contact.bookmarked = !contact.bookmarked;
    await contact.save();
    res.status(200).json(contact);
});





export const searchContacts = asyncHandler(async (req: Request, res: Response) => {
    const searchTerm = req.params.query as string;
    const label = req.query.label as string;
    const filter: any = {};

    const trimmedSearchTerm = searchTerm ? searchTerm.trim() : '';

    if (trimmedSearchTerm !== "") {
        filter.name = { $regex: trimmedSearchTerm, $options: 'i' };
    }
  
    const trimmedLabel = label ? label.trim().toLowerCase() : '';

    if (trimmedLabel !== "" && trimmedLabel !== 'all') {
        filter.label = label;
        
    }

    const paginationResult = await applyPaginationAndSorting(req, filter);

    res.status(200).json(
        new ApiResponse(200, paginationResult, "Contacts found successfully.")
    );
});



const getContactsByLabel = asyncHandler(async (req: Request, res: Response) => {
    const { label } = req.params;
    

    if (!label || label.trim() === "") {
        throw new ApiError(400, "Label is required to find contact");
    }

    const filter: any = { label: label };
  

    const paginationResult = await applyPaginationAndSorting(req, filter);

    res.status(200).json(
        new ApiResponse(200, paginationResult, "Contacts found successfully with the given label")
    );
});




const getAllContacts = asyncHandler(async (req: Request, res: Response) => {
 

    const filter: any = {};
    

    const paginationResult = await applyPaginationAndSorting(req, filter);

    res.status(200).json(
        new ApiResponse(200, paginationResult, "All contacts fetched with pagination and sorting.")
    );
});


export { registerContact, updateContactById, getContactByName, getContactsByLabel, toggleBookmark, getAllContacts }