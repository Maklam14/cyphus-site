import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    updateEmail, 
    updatePassword, 
    deleteUser 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-storage.js";

const firebaseConfig = { /* seu config */ };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const avatar = document.getElementById("profile-avatar");
const photo = document.getElementById("profile-photo");
const photoInput = document.getElementById("photo-input");

onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = "entrar.html";

    document.getElementById("user-email").textContent = user.email;
    document.getElementById("user-uid").textContent = user.uid;

    avatar.textContent = (user.displayName || user.email).charAt(0).toUpperCase();

    // Carregar endereço
    const refUser = doc(db, "users", user.uid);
    const snap = await getDoc(refUser);

    if (snap.exists()) {
        const data = snap.data();
        if (data.address) {
            document.getElementById("user-address").textContent = data.address;
        }
        if (data.photoURL) {
            photo.src = data.photoURL;
            photo.style.display = "block";
            avatar.style.display = "none";
        }
    }

    // Alterar email
    document.getElementById("change-email").onclick = async () => {
        const novoEmail = prompt("Digite o novo email:");
        if (!novoEmail) return;
        await updateEmail(user, novoEmail);
        alert("Email atualizado!");
        location.reload();
    };

    // Alterar senha
    document.getElementById("change-password").onclick = async () => {
        const novaSenha = prompt("Digite a nova senha:");
        if (!novaSenha) return;
        await updatePassword(user, novaSenha);
        alert("Senha atualizada!");
    };

    // Alterar endereço
    document.getElementById("change-address").onclick = async () => {
        const novoEndereco = prompt("Digite seu endereço:");
        if (!novoEndereco) return;

        await setDoc(refUser, { address: novoEndereco }, { merge: true });

        alert("Endereço atualizado!");
        location.reload();
    };

    // Upload de foto
    document.getElementById("upload-photo").onclick = () => photoInput.click();

    photoInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const storageRef = ref(storage, `profilePhotos/${user.uid}`);
        await uploadBytes(storageRef, file);

        const url = await getDownloadURL(storageRef);

        await setDoc(refUser, { photoURL: url }, { merge: true });

        alert("Foto atualizada!");
        location.reload();
    };

    // Excluir conta
    document.getElementById("delete-account").onclick = async () => {
        if (!confirm("Tem certeza que deseja excluir sua conta?")) return;
        await deleteUser(user);
        alert("Conta excluída.");
        window.location.href = "index.html";
    };

    // Logout
    document.getElementById("logout").onclick = () => {
        signOut(auth);
        window.location.href = "entrar.html";
    };
});