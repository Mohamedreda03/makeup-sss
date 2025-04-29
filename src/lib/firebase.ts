// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "demo-project.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:123456789:web:abcdef123456789",
};

// Debug Firebase configuration
console.log("Firebase configuration:", {
  apiKey: firebaseConfig.apiKey ? "API Key is set" : "API Key is missing",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId
    ? "Sender ID is set"
    : "Sender ID is missing",
  appId: firebaseConfig.appId ? "App ID is set" : "App ID is missing",
});

// Check for missing critical environment variables
if (
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
) {
  console.warn(
    "Firebase configuration warning: Missing or incomplete environment variables. " +
      "Please configure your Firebase project in .env.local file. " +
      "Using default values which will not work for real storage operations."
  );
}

// Define variables for the app and storage
let firebaseApp;
let storageInstance;

try {
  console.log("Initializing Firebase...");

  // Avoid re-initializing the app if it already exists
  if (!getApps().length) {
    console.log("No existing Firebase app found, creating new app");
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    console.log("Using existing Firebase app");
    firebaseApp = getApps()[0];
  }

  // Initialize storage
  console.log("Initializing Firebase Storage...");
  storageInstance = getStorage(firebaseApp);
  console.log("Firebase Storage initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);

  // In case of error, create a mock storage instance to prevent app crashes
  console.log("Creating mock storage instance due to initialization error");
  storageInstance = {
    ref: (path: string) => {
      console.log("Mock storage: ref called with path", path);
      return {
        put: (file: File) => {
          console.log("Mock storage: put called with file", file.name);
          return {
            on: (
              event: string,
              progressCallback: Function,
              errorCallback: Function,
              completeCallback: Function
            ) => {
              console.log("Mock storage: on event registered", event);
              // Simulate progress and completion
              setTimeout(
                () =>
                  progressCallback({ bytesTransferred: 50, totalBytes: 100 }),
                500
              );
              setTimeout(
                () =>
                  progressCallback({ bytesTransferred: 100, totalBytes: 100 }),
                1000
              );
              setTimeout(() => completeCallback(), 1200);
            },
            then: (callback: Function) => {
              console.log("Mock storage: then called");
              setTimeout(
                () =>
                  callback({
                    ref: {
                      getDownloadURL: () =>
                        Promise.resolve("https://placeholder.com/image.jpg"),
                    },
                  }),
                1000
              );
              return { catch: () => {} };
            },
            catch: (callback: Function) => {
              return { then: () => {} };
            },
          };
        },
        getDownloadURL: () => {
          console.log("Mock storage: getDownloadURL called");
          return Promise.resolve("https://placeholder.com/image.jpg");
        },
        snapshot: {
          ref: {
            getDownloadURL: () =>
              Promise.resolve("https://placeholder.com/image.jpg"),
          },
        },
      };
    },
  } as any;
}

// Export the storage instance and the app
export const storage = storageInstance;
export default firebaseApp;
