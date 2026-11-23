# Firebase setup for the wish wall

Wishes are stored in Cloud Firestore so every visitor sees the same wall. Until `js/firebase-config.js` has a real config, the site saves wishes in this browser only (`localStorage`).

## 1. Create a Firebase project

1. Open [https://console.firebase.google.com](https://console.firebase.google.com) and sign in with Google.
2. Click **Add project** (or **Create a project**).
3. Name it something like `omhonria-emmanuel-birthday`.
4. You can turn Google Analytics off. Create the project and wait until it finishes.

## 2. Create a Firestore database

1. In the left menu open **Build** then **Firestore Database**.
2. Click **Create database**.
3. Start in **production mode** (you will paste rules next).
4. Pick a location close to your church (for example `nam5` or `eur3`) and enable the database.

## 3. Paste the security rules

1. Open the **Rules** tab of Firestore.
2. Replace everything with the contents of `firestore.rules` in this folder.
3. Click **Publish**.

Anyone can read wishes and add a new one. A wish may contain only `name`, `message`, `position` (Family, Friends, or Church Member), and `createdAt`. Edits are blocked. Only a signed-in Firebase user can delete.

## 4. Turn on email sign-in and create the admin

1. Open **Build** then **Authentication**.
2. Click **Get started**, then enable **Email/Password**. You do not need the email-link option.
3. Open the **Users** tab and click **Add user**.
4. Enter the admin email and a password. This is the only account that should sign in on the site. There is no sign-up form.

The Firestore rules allow delete for any signed-in user. Do not share the Firebase web API in a way that lets other people create accounts, and do not add a public sign-up button.

## 5. Register a web app and copy the config

1. Click the gear next to **Project overview**, then **Project settings**.
2. Scroll to **Your apps** and click the **Web** icon (`</>`).
3. App nickname: `birthday-site`. You do not need Firebase Hosting.
4. Register the app.
5. Copy the values inside `firebaseConfig`.

## 6. Paste the config into this site

Open `js/firebase-config.js` and replace the placeholders:

```js
export const firebaseConfig = {
  apiKey: "paste-here",
  authDomain: "paste-here",
  projectId: "paste-here",
  storageBucket: "paste-here",
  messagingSenderId: "paste-here",
  appId: "paste-here",
};
```

Save the file and refresh the site. New wishes should appear for every visitor, newest first.

## 7. Admin delete

On the Wishes section, click **Admin**, sign in with the email and password from Authentication, and delete a card. Click **Sign out** when you are finished. The password is not stored in this project.

## 8. Local test without Firebase

Leave the placeholder config as it is, or clear the strings. Send a wish: it stays in this browser. Once the real config is filled, the live Firestore wall is used instead.
