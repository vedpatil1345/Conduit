/* eslint-disable @typescript-eslint/no-explicit-any */
import { SECRET_KEY } from "@/common/constants/app-constants";
import CryptoJS from "crypto-js";

export const encrypt = (data: object | undefined | null | string): string => {
	return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

export const encryptString = (data: string): string => {
	return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decrypt = <T>(
	ciphertext: string | undefined | null
): T | undefined => {
	try {
		if (ciphertext === null || ciphertext === undefined) {
			return;
		}
		const bytes = CryptoJS.AES.decrypt(ciphertext.toString(), SECRET_KEY);
		return JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) as T;
	} catch {
		if (ciphertext === null || ciphertext === undefined) {
			return;
		}
		try {
			return JSON.parse(ciphertext) as T;
		} catch {
			return;
		}
	}
};

export const decryptString = (ciphertext: string): string => {
	try {
		if (ciphertext === null || ciphertext === undefined) {
			return "";
		}
		const bytes = CryptoJS.AES.decrypt(ciphertext.toString(), SECRET_KEY);
		return bytes.toString(CryptoJS.enc.Utf8);
	} catch {
		if (ciphertext === null || ciphertext === undefined) {
			return "";
		}
		try {
			return ciphertext;
		} catch {
			return "";
		}
	}
};

export const decodeUrl = (link: string): { [key: string]: string } => {
	try {
		const url = link.split("?");
		return JSON.parse(atob(url[url.length - 1] || ""));
	} catch (exception:any) {
		return {exception:exception?.toString()};
	}
};
