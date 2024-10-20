"use client";
import {
  Typography,
  Card,
  Avatar,
  Input,
  Button,
} from "@material-tailwind/react";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  getFirestore,
  getDocs,
  query,
  collection,
  where,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "../header";
import { useAuthState } from "react-firebase-hooks/auth";
import { isAuthenticated } from "../../utils/auth";
import { useRouter } from "next/navigation";

export default function UserProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      console.log("User is not authenticated, redirecting to home...");
      router.push("/");
      return;
    }
    const checkAuth = async () => {
      const authorized = await isAuthenticated("faculty");
      setIsAuthorized(authorized);
    };
    checkAuth();
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        auth.onAuthStateChanged(async (currentUser) => {
          if (currentUser) {
            const userEmail = currentUser.email;
            console.log("User email:", userEmail);
            const db = getFirestore();
            const userQuery = query(
              collection(db, "userdata"),
              where("email", "==", userEmail)
            );
            const unsubscribe = onSnapshot(userQuery, (querySnapshot) => {
              if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                  const userData = doc.data();
                  setName(userData.name);
                  setEmail(userData.email);
                  setProfileUrl(userData.profileUrl);
                });
              } else {
                console.error("User not found or role not specified");
              }
            });
            return () => unsubscribe(); // Cleanup listener on component unmount
          }
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setProfilePhoto(file);
  };

  const handleUpload = async () => {
    if (!profilePhoto) return;
    try {
      const storageRef = ref(storage, "profileImages/" + profilePhoto.name);
      await uploadBytes(storageRef, profilePhoto);
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Image uploaded:", downloadURL);
      const db = getFirestore();
      const userRef = collection(db, "userdata");
      const userQuery = query(userRef, where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        userSnapshot.forEach(async (doc) => {
          const userDocRef = doc.ref;
          try {
            await updateDoc(userDocRef, {
              profileUrl: downloadURL,
            });
            console.log("Profile URL updated in Firestore");
            toast.success("Profile Photo Updated Successfully");
          } catch (error) {
            console.error("Error updating profile URL:", error);
            toast.error("There is an error");
          }
        });
      } else {
        console.error("User not found");
        toast.error("There is an error");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("There is an error");
    }
  };

  const handleChangePassword = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const Emailcredential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, Emailcredential);
      console.log("Credential:", Emailcredential);

      if (newPassword !== confirmPassword) {
        console.error("New password and confirm password do not match");
        toast.error("New password and confirm password do not match");
        return;
      }
      await updatePassword(user, newPassword).then(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      });
      toast.success("Updating the password is successful");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Error updating password");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return isAuthorized ? (
    <>
      <div className="bg-[#8d9e84] min-h-screen">
        <div className="flex-1">
          <Header />
          <div className="flex flex-col items-center h-[calc(100vh-64px)]  pt-16">
            <Typography variant="h2" className="mb-4 text-center">
              User Profile
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="w-96 p-8">
                <div className="flex justify-center mb-6">
                  {profileUrl ? (
                    <Image
                      src={profileUrl}
                      width={200}
                      height={200}
                      alt="User Picture"
                      className="w-40 h-40 rounded-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/Avatar.jpg"
                      width={200}
                      height={200}
                      alt="User Picture"
                      className="w-40 h-40 rounded-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col space-y-5">
                  <Input type="file" onChange={handleFileChange}></Input>
                  <Button color="green" onClick={handleUpload}>
                    Upload Profile Photo
                  </Button>
                </div>
                <Typography color="gray" className="font-normal mt-2 mb-2">
                  Student Name:
                </Typography>
                <Typography color="gray" className="font-bold mb-4">
                  {name}
                </Typography>
                <Typography className="font-normal mb-2">Email:</Typography>
                <Typography color="gray" className="font-bold mb-4">
                  {email}
                </Typography>
              </Card>
              <Card className="w-96 p-8">
                <Typography
                  color="gray"
                  className="text-xl font-bold mb-5 text-center"
                >
                  Change Password
                </Typography>
                <div className="flex flex-col space-y-2">
                  <Typography color="gray" className="font-bold mb-2 ">
                    Current Password:
                  </Typography>
                  <Input
                    label="Enter The Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  ></Input>
                  <Typography color="gray" className="font-bold mb-2 ">
                    New Password:
                  </Typography>
                  <Input
                    label="Enter The New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  ></Input>
                  <Typography color="gray" className="font-bold mb-2 ">
                    Confirm New Password:
                  </Typography>
                  <Input
                    label="Confirm the New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  ></Input>
                </div>
                <Button
                  color="green"
                  className="mt-5"
                  onClick={handleChangePassword}
                >
                  Submit
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  ) : null;
}