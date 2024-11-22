import { Request, Response, NextFunction } from "express";
import User from "../models/user-model.js";
import { configureOpenAI } from "../configs/open-ai-config.js";
import { OpenAI } from "openai"; // Correct OpenAI import

// Define the type for ChatCompletionRequestMessage
interface ChatCompletionRequestMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const generateChatCompletion = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { message } = req.body;

		// Find the user by their JWT data
		const user = await User.findById(res.locals.jwtData.id);
		if (!user) {
			return res.status(401).json("User not registered / token malfunctioned");
		}

		// Prepare user chats for OpenAI (format as required)
		const chats: ChatCompletionRequestMessage[] = user.chats.map(({ role, content }) => ({
			role: role as 'user' | 'assistant' | 'system',  // Type assertion to restrict 'role' to the allowed values
			content,
		}));

		chats.push({ content: message, role: "user" });

		// Save new chat message in the user's chats array
		user.chats.push({ content: message, role: "user" });

		// Initialize OpenAI client with configuration
		const openai = configureOpenAI(); // We configure it here

		// Request chat completion from OpenAI
		const chatResponse = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			messages: chats,
		});

		// Save OpenAI response in user's chat history
		user.chats.push({
			role: "assistant",
			content: chatResponse.choices[0].message?.content || "No response",
		});
		await user.save();

		// Respond with the updated chats
		return res.status(200).json({ chats: user.chats });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: error.message });
	}
};


export const getAllChats = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Find the user by ID (based on JWT token data)
		const user = await User.findById(res.locals.jwtData.id); 
		if (!user)
			return res.status(401).json({
				message: "ERROR",
				cause: "User doesn't exist or token malfunctioned",
			});

		// Check permissions
		if (user._id.toString() !== res.locals.jwtData.id) {
			return res
				.status(401)
				.json({ message: "ERROR", cause: "Permissions didn't match" });
		}

		// Respond with the user's chats
		return res.status(200).json({ message: "OK", chats: user.chats });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};

export const deleteAllChats = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Find the user by ID (based on JWT token data)
		const user = await User.findById(res.locals.jwtData.id); 
		if (!user)
			return res.status(401).json({
				message: "ERROR",
				cause: "User doesn't exist or token malfunctioned",
			});

		// Check permissions
		if (user._id.toString() !== res.locals.jwtData.id) {
			return res
				.status(401)
				.json({ message: "ERROR", cause: "Permissions didn't match" });
		}

		// Clear the user's chats
		user.chats.splice(0, user.chats.length);
		await user.save();

		// Respond with success
		return res.status(200).json({ message: "OK", chats: user.chats });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};
