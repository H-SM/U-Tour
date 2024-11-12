import { useState, useEffect, useContext, useCallback } from 'react';
import { auth } from '../firebase/config';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import ContextValue from "../context/EventContext";

export const useFirebaseAuth = () => {
    const [user, setUser] = useState(null);
    const { userDetailsFirebase, setUserDetailsFirebase } = useContext(ContextValue);

    const handleAuthStateChange = useCallback((user) => {
        if (user && userDetailsFirebase === null) {
            setUser(user);
            const userDetails = {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                phone: user.phoneNumber,
                photoURL: user.photoURL,
                creationTime: user.metadata.creationTime,
            };
            setUserDetailsFirebase(userDetails);
            console.log(user, userDetails);
        } else if (!user) {
            setUser(null);
            setUserDetailsFirebase(null);
        }
    }, [setUserDetailsFirebase, userDetailsFirebase]);

    const checkAuth = async () => {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                handleAuthStateChange(user);
                resolve(user);
            });
        });
    };

    const signUp = async (email, password, name) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    };

    const signIn = (email, password) => {
        const res = signInWithEmailAndPassword(auth, email, password);
        console.log(res.result);
        return res;
    };

    const signOutUser = () => {
        setUser(null);
        setUserDetailsFirebase(null);
        return signOut(auth);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            throw error;
        }
    };

    const signInWithGithub = async () => {
        const provider = new GithubAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            throw error;
        }
    };

    const forgotPassword = (email) => {
        return sendPasswordResetEmail(auth, email);
    };

    return {
        user,
        checkAuth,
        signUp,
        signIn,
        signOutUser,
        signInWithGoogle,
        signInWithGithub,
        forgotPassword,
    };
};

export default useFirebaseAuth;