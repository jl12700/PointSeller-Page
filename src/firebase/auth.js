import { auth } from "./firebase";

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export const doCreateUserWithEmailandPassword = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const doSignInWithEmailandPassword = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const doSignInWithGoogle = async () => {


};