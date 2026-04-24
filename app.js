import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBJDNlFLCQAdkjSLoW6NB7hM5wWftLxSaQ",
    authDomain: "vibechat-bfbbf.firebaseapp.com",
    projectId: "vibechat-bfbbf",
    storageBucket: "vibechat-bfbbf.firebasestorage.app",
    messagingSenderId: "928085655069",
    appId: "1:928085655069:web:a0c0da9ad16a960267d0f4",
    measurementId: "G-NNH1W8YTWK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Utility Functions ---
const showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'fa-info-circle';
    if(type === 'success') icon = 'fa-check-circle';
    if(type === 'error') icon = 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s backwards reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// --- DOM Elements ---
const DOM = {
    authContainer: document.getElementById('auth-container'),
    appContainer: document.getElementById('app-container'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    secondaryAuthForm: document.getElementById('secondary-auth-form'),
    
    loginEmail: document.getElementById('login-email'),
    loginPass: document.getElementById('login-password'),
    loginBtn: document.getElementById('login-btn'),
    googleBtn: document.getElementById('google-login-btn'),
    
    signupName: document.getElementById('signup-name'),
    signupEmail: document.getElementById('signup-email'),
    signupPass: document.getElementById('signup-password'),
    signupBtn: document.getElementById('signup-btn'),
    
    communityPass: document.getElementById('community-password'),
    communityBtn: document.getElementById('community-login-btn'),
    showSignup: document.getElementById('show-signup'),
    showLogin: document.getElementById('show-login'),

    themeToggle: document.getElementById('theme-toggle'),
    sidebar: document.getElementById('sidebar'),
    chatArea: document.getElementById('chat-area'),
    noChatSelected: document.getElementById('no-chat-selected'),
    activeChat: document.getElementById('active-chat'),
    backToSidebar: document.getElementById('back-to-sidebar'),

    userName: document.getElementById('user-name'),
    userAvatar: document.getElementById('user-avatar'),
    userStatusText: document.getElementById('user-status-text'),

    contactsList: document.getElementById('contacts-list'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    contactSearch: document.getElementById('contact-search'),
    unreadBadge: document.getElementById('unread-total-badge'),

    chatName: document.getElementById('chat-name'),
    chatAvatar: document.getElementById('chat-avatar'),
    chatStatus: document.getElementById('chat-last-seen'),
    chatOnlineIndicator: document.getElementById('chat-online-indicator'),
    
    messagesContainer: document.getElementById('messages-container'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    
    recordBtn: document.getElementById('record-btn'),
    voiceRecordingUI: document.getElementById('voice-recording-ui'),
    cancelRecordingBtn: document.getElementById('cancel-recording'),
    recordingTimeText: document.getElementById('recording-time'),
    
    replyContainer: document.getElementById('replying-to-container'),
    replyUser: document.getElementById('reply-to-user'),
    replyText: document.getElementById('reply-to-text'),
    cancelReply: document.getElementById('cancel-reply'),

    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    logoutBtn: document.getElementById('logout-btn'),
    deleteAccountBtn: document.getElementById('delete-account-btn'),
    
    editName: document.getElementById('edit-name'),
    editBio: document.getElementById('edit-bio'),
    editAvatar: document.getElementById('edit-avatar'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    avatarUploadInput: document.getElementById('avatar-upload-input'),
    avatarEditBtn: document.querySelector('.avatar-edit-btn'),

    chatOptionsBtn: document.getElementById('chat-options-btn'),
    chatOptionsMenu: document.getElementById('chat-options-menu'),
    createGroupBtn: document.getElementById('create-group-btn'),
    viewProfileBtn: document.getElementById('view-profile-btn'),
    chatDetailsBtn: document.getElementById('chat-details-btn'),
    
    chatSearchBtn: document.getElementById('chat-search-btn'),
    chatSearchBarContainer: document.getElementById('chat-search-bar-container'),
    chatSearchInput: document.getElementById('chat-search-input'),
    closeChatSearch: document.getElementById('close-chat-search'),

    contextMenu: document.getElementById('message-context-menu'),
    
    emojiBtn: document.getElementById('emoji-btn'),
    emojiPicker: document.getElementById('emoji-picker-container'),
    emojiOpts: document.querySelectorAll('.emoji-opt'),
    attachBtn: document.getElementById('attach-btn'),
    mediaUploadInput: document.getElementById('media-upload-input'),
    
    chatStarBtn: document.getElementById('chat-star-btn'),
    
    voiceCallBtn: document.getElementById('voice-call-btn'),
    videoCallBtn: document.getElementById('video-call-btn'),
    callModal: document.getElementById('call-modal'),
    callAvatar: document.getElementById('call-avatar'),
    callName: document.getElementById('call-name'),
    callStatus: document.getElementById('call-status'),
    endCallBtn: document.getElementById('end-call-btn')
};

// --- State ---
const state = {
    currentUser: null,
    userProfileData: null,
    communityVerified: false,
    activeChatId: null,
    activeChatData: null,
    contacts: [],
    messages: [],
    theme: 'dark',
    replyingToMsgId: null,
    editingMsgId: null,
    recordingInterval: null,
    recordingTime: 0,
    mediaRecorder: null,
    audioChunks: [],
    contextMenuTargetId: null,
    activeTab: 'active',
    searchQuery: '',
    chatSearchQuery: '',
    unsubChats: null,
    unsubMessages: null
};

const MOCK_COMMUNITY_PASS = "MyPeople";

// --- Initialization ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        state.currentUser = user;
        // Check/Create User Profile in DB
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName || user.email.split('@')[0],
                email: user.email,
                photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=random`,
                bio: 'Available',
                online: true,
                lastSeen: serverTimestamp(),
                favorites: []
            });
        }
        
        // Setup presence
        updateDoc(userRef, { online: true });
        window.addEventListener('beforeunload', () => updateDoc(userRef, { online: false, lastSeen: serverTimestamp() }));
        
        // Fetch User Data
        onSnapshot(userRef, (doc) => {
            state.userProfileData = doc.data();
            DOM.userName.textContent = state.userProfileData.displayName;
            DOM.userAvatar.src = state.userProfileData.photoURL;
            DOM.editName.value = state.userProfileData.displayName;
            DOM.editBio.value = state.userProfileData.bio || '';
            DOM.editAvatar.src = state.userProfileData.photoURL;
        });

        DOM.loginForm.classList.add('hidden');
        DOM.signupForm.classList.add('hidden');
        DOM.secondaryAuthForm.classList.remove('hidden');
    } else {
        DOM.authContainer.classList.remove('hidden');
        DOM.appContainer.classList.add('hidden');
        DOM.secondaryAuthForm.classList.add('hidden');
        DOM.loginForm.classList.remove('hidden');
    }
});

// --- Auth Flow ---
DOM.showSignup.addEventListener('click', () => { DOM.loginForm.classList.add('hidden'); DOM.signupForm.classList.remove('hidden'); });
DOM.showLogin.addEventListener('click', () => { DOM.signupForm.classList.add('hidden'); DOM.loginForm.classList.remove('hidden'); });

DOM.loginBtn.addEventListener('click', async () => {
    const originalText = DOM.loginBtn.innerHTML;
    DOM.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    DOM.loginBtn.disabled = true;
    try {
        await signInWithEmailAndPassword(auth, DOM.loginEmail.value, DOM.loginPass.value);
        // On success, onAuthStateChanged handles the UI update
    } catch (error) { 
        console.error("Login error:", error);
        showToast(error.message.replace('Firebase: ', ''), 'error'); 
        DOM.loginBtn.innerHTML = originalText;
        DOM.loginBtn.disabled = false;
    }
});

DOM.loginPass.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') DOM.loginBtn.click();
});
DOM.loginEmail.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') DOM.loginBtn.click();
});

DOM.signupBtn.addEventListener('click', async () => {
    const originalText = DOM.signupBtn.innerHTML;
    DOM.signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing up...';
    DOM.signupBtn.disabled = true;
    try {
        const cred = await createUserWithEmailAndPassword(auth, DOM.signupEmail.value, DOM.signupPass.value);
        await updateProfile(cred.user, { displayName: DOM.signupName.value });
    } catch (error) { 
        console.error("Signup error:", error);
        showToast(error.message.replace('Firebase: ', ''), 'error'); 
        DOM.signupBtn.innerHTML = originalText;
        DOM.signupBtn.disabled = false;
    }
});

DOM.signupPass.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') DOM.signupBtn.click();
});

DOM.googleBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (error) { showToast(error.message, 'error'); }
});

DOM.communityBtn.addEventListener('click', () => {
    if(DOM.communityPass.value === MOCK_COMMUNITY_PASS) {
        state.communityVerified = true;
        DOM.authContainer.classList.add('hidden');
        DOM.appContainer.classList.remove('hidden');
        loadChats();
        listenForCalls();
        showToast('Authentication successful', 'success');
        setupBrowserNotifications();
        requestMediaPermissions();
    } else { 
        showToast('Invalid community password', 'error'); 
    }
});

DOM.communityPass.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') DOM.communityBtn.click();
});

const requestMediaPermissions = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(t => t.stop());
    } catch(err) {
        console.log("Media permissions denied or not available", err);
    }
};

DOM.logoutBtn.addEventListener('click', async () => {
    if(state.currentUser) await updateDoc(doc(db, 'users', state.currentUser.uid), { online: false, lastSeen: serverTimestamp() });
    await signOut(auth);
    window.location.reload();
});

DOM.deleteAccountBtn.addEventListener('click', async () => {
    if(confirm('Are you sure you want to delete your account? This cannot be undone.')) {
        try {
            await deleteDoc(doc(db, 'users', state.currentUser.uid));
            await deleteUser(state.currentUser);
            window.location.reload();
        } catch (e) { showToast(e.message, 'error'); }
    }
});

// --- Profile & Avatar ---
DOM.avatarEditBtn.addEventListener('click', () => DOM.avatarUploadInput.click());
DOM.avatarUploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 800000) {
        showToast('Image too large (Max 800KB without external storage)', 'error');
        return;
    }
    showToast('Updating avatar...', 'info');
    const reader = new FileReader();
    reader.onload = async (ev) => {
        const base64Url = ev.target.result;
        await updateDoc(doc(db, 'users', state.currentUser.uid), { photoURL: base64Url });
        showToast('Avatar updated', 'success');
    };
    reader.readAsDataURL(file);
});

DOM.saveProfileBtn.addEventListener('click', async () => {
    try {
        await updateDoc(doc(db, 'users', state.currentUser.uid), {
            displayName: DOM.editName.value,
            bio: DOM.editBio.value
        });
        showToast('Profile updated', 'success');
        DOM.settingsModal.classList.add('hidden');
    } catch(e) { showToast(e.message, 'error'); }
});

// --- Chat Loading & UI ---
const loadChats = () => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', state.currentUser.uid));
    state.unsubChats = onSnapshot(q, async (snapshot) => {
        const chats = [];
        for (let document of snapshot.docs) {
            const data = document.data();
            // Get other user's data if it's a 1-on-1
            let name = data.isGroup ? data.groupName : 'Unknown';
            let avatar = data.isGroup ? `https://ui-avatars.com/api/?name=${encodeURIComponent(data.groupName)}&background=random` : '';
            let online = false;
            let lastSeen = '';
            
            if (!data.isGroup) {
                const otherUid = data.participants.find(id => id !== state.currentUser.uid);
                if (otherUid) {
                    const userSnap = await getDoc(doc(db, 'users', otherUid));
                    if (userSnap.exists()) {
                        const ud = userSnap.data();
                        name = ud.displayName;
                        avatar = ud.photoURL;
                        online = ud.online;
                        if(ud.lastSeen) {
                            const d = ud.lastSeen.toDate();
                            lastSeen = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        }
                    }
                }
            }

            const isFav = state.userProfileData?.favorites?.includes(document.id);
            const unreadCount = data.unreadCount && data.unreadCount[state.currentUser.uid] ? data.unreadCount[state.currentUser.uid] : 0;

            let tab = 'active';
            if(data.isGroup) tab = 'groups';
            if(isFav) tab = 'friends'; // Let's use friends for favorites

            chats.push({
                id: document.id,
                name, avatar, online, lastSeen, 
                lastMsg: data.lastMessage || 'Start a conversation',
                time: data.lastMessageTime ? data.lastMessageTime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
                timestamp: data.lastMessageTime ? data.lastMessageTime.toMillis() : 0,
                unread: unreadCount,
                tab,
                isFavorite: isFav,
                isGroup: data.isGroup || false,
                participants: data.participants || [],
                admins: data.admins || []
            });
        }
        chats.sort((a, b) => b.timestamp - a.timestamp);
        state.contacts = chats;
        renderContacts();
    });
};

const renderContacts = () => {
    let filtered = state.contacts;
    if(state.activeTab !== 'active') { // For active, show all except maybe archived (omitted for simplicity)
        if(state.activeTab === 'unread') filtered = filtered.filter(c => c.unread > 0);
        else filtered = filtered.filter(c => c.tab === state.activeTab);
    }
    if(state.searchQuery) {
        filtered = filtered.filter(c => (c.name || '').toLowerCase().includes(state.searchQuery.toLowerCase()));
        if(state.searchedUsers && state.searchedUsers.length > 0) {
            filtered = [...filtered, ...state.searchedUsers];
        }
    }

    DOM.contactsList.innerHTML = '';
    let totalUnread = state.contacts.reduce((acc, c) => acc + c.unread, 0);
    DOM.unreadBadge.textContent = totalUnread;
    DOM.unreadBadge.classList.toggle('hidden', totalUnread === 0);

    if(filtered.length === 0) {
        DOM.contactsList.innerHTML = `<div class="empty-state"><i class="fas fa-users-slash"></i><p>No contacts found</p></div>`;
        return;
    }

    filtered.forEach(contact => {
        const div = document.createElement('div');
        div.className = `contact-item ${state.activeChatId === contact.id ? 'active' : ''}`;
        div.innerHTML = `
            <div class="avatar-wrapper">
                <img src="${contact.avatar}" class="avatar" alt="Avatar">
                ${contact.online && !contact.isGroup ? `<span class="status-indicator online"></span>` : ''}
            </div>
            <div class="contact-info">
                <div class="contact-header">
                    <span class="contact-name">${contact.name} ${contact.isFavorite ? '<i class="fas fa-star" style="color:var(--warning-color);font-size:0.7rem;"></i>' : ''}</span>
                    <span class="contact-time">${contact.time}</span>
                </div>
                <div class="contact-msg">
                    <span class="truncate">${contact.lastMsg}</span>
                </div>
            </div>
            <div class="contact-meta">
                ${contact.unread > 0 ? `<span class="unread-badge">${contact.unread}</span>` : ''}
            </div>
        `;
        div.addEventListener('click', () => openChat(contact));
        DOM.contactsList.appendChild(div);
    });
};

// --- Creating Chats / Groups ---
DOM.createGroupBtn.addEventListener('click', () => {
    document.getElementById('new-group-name').value = '';
    document.getElementById('create-group-modal').classList.remove('hidden');
});

document.getElementById('close-create-group-modal').addEventListener('click', () => {
    document.getElementById('create-group-modal').classList.add('hidden');
});

document.getElementById('confirm-create-group-btn').addEventListener('click', async () => {
    const groupName = document.getElementById('new-group-name').value.trim();
    if(!groupName) {
        showToast('Please enter a group name', 'error');
        return;
    }
    const btn = document.getElementById('confirm-create-group-btn');
    btn.disabled = true;
    try {
        await addDoc(collection(db, 'chats'), {
            isGroup: true,
            groupName: groupName,
            participants: [state.currentUser.uid],
            admins: [state.currentUser.uid],
            lastMessage: 'Group created',
            lastMessageTime: serverTimestamp()
        });
        showToast('Group created successfully', 'success');
        document.getElementById('create-group-modal').classList.add('hidden');
    } catch(e) { showToast(e.message, 'error'); }
    btn.disabled = false;
});

// Since there is no user search UI, a simple prompt to start chat by email
DOM.contactSearch.addEventListener('keypress', async (e) => {
    if(e.key === 'Enter' && state.searchQuery.includes('@')) {
        // Search user by email
        const q = query(collection(db, 'users'), where('email', '==', state.searchQuery.trim()));
        const snap = await getDocs(q);
        if(!snap.empty) {
            const otherUser = snap.docs[0].data();
            if(otherUser.uid === state.currentUser.uid) return showToast("Can't chat with yourself", "error");
            
            // Check if chat exists
            const existingChat = state.contacts.find(c => !c.isGroup && c.name === otherUser.displayName);
            if(existingChat) {
                openChat(existingChat);
            } else {
                const docRef = await addDoc(collection(db, 'chats'), {
                    isGroup: false,
                    participants: [state.currentUser.uid, otherUser.uid],
                    lastMessage: '',
                    lastMessageTime: serverTimestamp(),
                    unreadCount: {}
                });
                state.searchQuery = '';
                DOM.contactSearch.value = '';
                showToast("Chat created", "success");
            }
        } else {
            showToast("User not found", "error");
        }
    }
});

// --- Active Chat ---
const openChat = async (contact) => {
    if(contact.isNew) {
        const docRef = await addDoc(collection(db, 'chats'), {
            isGroup: false,
            participants: [state.currentUser.uid, contact.uid],
            lastMessage: '',
            lastMessageTime: serverTimestamp(),
            unreadCount: {}
        });
        contact.id = docRef.id;
        contact.isNew = false;
        state.searchQuery = '';
        DOM.contactSearch.value = '';
        state.searchedUsers = [];
    }

    if(state.unsubMessages) state.unsubMessages();
    state.activeChatId = contact.id;
    state.activeChatData = contact;
    
    DOM.noChatSelected.classList.add('hidden');
    DOM.activeChat.classList.remove('hidden');
    
    DOM.chatName.textContent = contact.name;
    DOM.chatAvatar.src = contact.avatar;
    DOM.chatStatus.textContent = contact.isGroup ? 'Group Chat' : (contact.online ? 'Online' : contact.lastSeen);
    DOM.chatOnlineIndicator.className = `status-indicator ${contact.online && !contact.isGroup ? 'online' : 'hidden'}`;
    DOM.chatStarBtn.innerHTML = contact.isFavorite ? '<i class="fas fa-star" style="color:var(--warning-color);"></i>' : '<i class="far fa-star"></i>';
    
    // Clear unread in DB
    if(contact.unread > 0) {
        const chatRef = doc(db, 'chats', contact.id);
        const chatSnap = await getDoc(chatRef);
        if(chatSnap.exists()) {
            const currentUnread = chatSnap.data().unreadCount || {};
            currentUnread[state.currentUser.uid] = 0;
            await updateDoc(chatRef, { unreadCount: currentUnread });
        }
    }

    if(window.innerWidth <= 768) DOM.sidebar.classList.add('mobile-hidden');

    const q = query(collection(db, `chats/${contact.id}/messages`), orderBy('timestamp', 'asc'));
    state.unsubMessages = onSnapshot(q, (snapshot) => {
        state.messages = [];
        snapshot.forEach(doc => state.messages.push({id: doc.id, ...doc.data()}));
        renderMessages();
    });
};

const renderMessages = () => {
    DOM.messagesContainer.innerHTML = '';
    let displayedMessages = state.messages;
    
    // In-chat search filter
    if(state.chatSearchQuery) {
        displayedMessages = state.messages.filter(m => m.text && m.text.toLowerCase().includes(state.chatSearchQuery.toLowerCase()));
    }

    displayedMessages.forEach(msg => {
        // If deleted for me, skip
        if(msg.deletedFor && msg.deletedFor.includes(state.currentUser.uid)) return;

        const isMe = msg.senderId === state.currentUser.uid;
        const div = document.createElement('div');
        div.className = `message-wrapper ${isMe ? 'sent' : 'received'}`;
        div.dataset.id = msg.id;
        
        let contentHtml = '';
        if(msg.isDeleted) {
             contentHtml = `<div class="message-bubble deleted-message"><i class="fas fa-ban"></i> This message was deleted.</div>`;
        } else {
             let replyHtml = '';
             if(msg.replyTo) {
                 const repMsg = state.messages.find(m => m.id === msg.replyTo);
                 const repText = repMsg ? (repMsg.text || 'Media') : 'Deleted message';
                 replyHtml = `<div class="replied-message-ref">Replying: ${repText}</div>`;
             }
             
             if(msg.type === 'voice') {
                 contentHtml = `<div class="message-bubble"><audio controls src="${msg.mediaUrl}"></audio></div>`;
             } else if(msg.type === 'image') {
                 contentHtml = `<div class="message-bubble"><img src="${msg.mediaUrl}" style="max-width:200px; border-radius:8px;"/><br/>${msg.text}</div>`;
             } else if(msg.type === 'video') {
                 contentHtml = `<div class="message-bubble"><video controls src="${msg.mediaUrl}" style="max-width:200px; border-radius:8px;"></video><br/>${msg.text}</div>`;
             } else {
                 contentHtml = `<div class="message-bubble">${replyHtml}${msg.text}</div>`;
             }
        }
        
        // Use true read receipt logic (if group, could be complex, simple for now)
        let readHtml = '';
        if(isMe && !msg.isDeleted) {
            readHtml = `<i class="fas fa-check-double read-receipt ${msg.readBy && msg.readBy.length > 1 ? 'read' : 'delivered'}"></i>`;
        }
        
        let timeStr = '';
        if(msg.timestamp) {
            try { timeStr = msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); } 
            catch(e) { timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); }
        }

        const isStarred = msg.starredBy && msg.starredBy.includes(state.currentUser.uid);
        const starHtml = isStarred ? '<i class="fas fa-star" style="color:var(--warning-color); font-size:0.7rem; margin-right:5px;"></i>' : '';

        div.innerHTML = `
            ${contentHtml}
            <div class="message-info">
                ${starHtml}
                <span>${timeStr}</span>
                ${msg.isEdited ? '(edited)' : ''}
                ${readHtml}
            </div>
            ${!msg.isDeleted ? `<div class="message-options" onclick="showContextMenu(event, '${msg.id}')"><i class="fas fa-chevron-down"></i></div>` : ''}
        `;
        DOM.messagesContainer.appendChild(div);
        
        // Mark as read logic
        if(!isMe && msg.readBy && !msg.readBy.includes(state.currentUser.uid)) {
            updateDoc(doc(db, `chats/${state.activeChatId}/messages/${msg.id}`), {
                readBy: arrayUnion(state.currentUser.uid)
            });
        }
    });
    DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
};

// --- Sending & Actions ---
const sendMessage = async (text, type = 'text', mediaUrl = null) => {
    if(!text && !mediaUrl) return;
    if(!state.activeChatId) return;

    if(state.editingMsgId) {
        // Handle Edit
        await updateDoc(doc(db, `chats/${state.activeChatId}/messages/${state.editingMsgId}`), {
            text: text,
            isEdited: true
        });
        state.editingMsgId = null;
        DOM.messageInput.value = '';
        return;
    }

    const newMsg = {
        senderId: state.currentUser.uid,
        text: text,
        type: type,
        timestamp: serverTimestamp(),
        readBy: [state.currentUser.uid]
    };
    if(mediaUrl) newMsg.mediaUrl = mediaUrl;
    if(state.replyingToMsgId) {
        newMsg.replyTo = state.replyingToMsgId;
        cancelReply();
    }

    try {
        await addDoc(collection(db, `chats/${state.activeChatId}/messages`), newMsg);
        DOM.messageInput.value = '';
        DOM.emojiPicker.classList.add('hidden');
        
        // Update chat
        const chatRef = doc(db, 'chats', state.activeChatId);
        const chatSnap = await getDoc(chatRef);
        const chatData = chatSnap.data();
        let newUnread = chatData.unreadCount || {};
        chatData.participants.forEach(p => {
            if(p !== state.currentUser.uid) newUnread[p] = (newUnread[p] || 0) + 1;
        });
        
        await updateDoc(chatRef, {
            lastMessage: type === 'text' ? text : (type === 'voice' ? 'Voice note' : 'Media'),
            lastMessageTime: serverTimestamp(),
            unreadCount: newUnread
        });
    } catch(e) { showToast(e.message, 'error'); }
};

DOM.sendBtn.addEventListener('click', () => {
    if(state.recordingTime > 0) stopRecording(false);
    else sendMessage(DOM.messageInput.value.trim());
});
DOM.messageInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendMessage(DOM.messageInput.value.trim());
});

// --- Media & Emojis ---
DOM.emojiBtn.addEventListener('click', () => DOM.emojiPicker.classList.toggle('hidden'));
DOM.emojiOpts.forEach(opt => {
    opt.addEventListener('click', (e) => {
        DOM.messageInput.value += e.target.textContent;
        DOM.messageInput.focus();
    });
});

DOM.attachBtn.addEventListener('click', () => DOM.mediaUploadInput.click());
DOM.mediaUploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 800000) {
        showToast('File too large (Max 800KB without external storage)', 'error');
        return;
    }
    const type = file.type.startsWith('image/') ? 'image' : 'video';
    showToast('Processing media...', 'info');
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
        const base64Url = ev.target.result;
        await sendMessage(DOM.messageInput.value.trim(), type, base64Url);
    };
    reader.readAsDataURL(file);
});

// --- Voice Recording ---
DOM.recordBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.mediaRecorder = new MediaRecorder(stream);
        state.audioChunks = [];
        
        state.mediaRecorder.ondataavailable = e => state.audioChunks.push(e.data);
        
        DOM.voiceRecordingUI.classList.remove('hidden');
        DOM.recordBtn.classList.add('hidden');
        DOM.messageInput.disabled = true;
        
        state.recordingTime = 0;
        DOM.recordingTimeText.textContent = "00:00";
        state.recordingInterval = setInterval(() => {
            state.recordingTime++;
            const mins = Math.floor(state.recordingTime / 60).toString().padStart(2, '0');
            const secs = (state.recordingTime % 60).toString().padStart(2, '0');
            DOM.recordingTimeText.textContent = `${mins}:${secs}`;
        }, 1000);
        
        state.mediaRecorder.start();
    } catch(e) { showToast('Microphone access denied', 'error'); }
});

const stopRecording = (discard = false) => {
    clearInterval(state.recordingInterval);
    DOM.voiceRecordingUI.classList.add('hidden');
    DOM.recordBtn.classList.remove('hidden');
    DOM.messageInput.disabled = false;
    
    if(state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.onstop = async () => {
            state.mediaRecorder.stream.getTracks().forEach(t => t.stop());
            if(!discard && state.recordingTime > 0) {
                showToast('Sending voice note...', 'info');
                const mimeType = state.mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(state.audioChunks, { type: mimeType });
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    const base64Url = ev.target.result;
                    if(base64Url.length > 900000) {
                        showToast('Voice note too long (Max ~30 seconds)', 'error');
                        return;
                    }
                    await sendMessage('', 'voice', base64Url);
                };
                reader.readAsDataURL(audioBlob);
            }
            state.recordingTime = 0;
        };
        state.mediaRecorder.stop();
    }
};

DOM.cancelRecordingBtn.addEventListener('click', () => stopRecording(true));

// --- Context Menu Actions ---
window.showContextMenu = (e, msgId) => {
    e.stopPropagation();
    state.contextMenuTargetId = msgId;
    const msg = state.messages.find(m => m.id === msgId);
    if(!msg) return;

    const isMe = msg.senderId === state.currentUser.uid;
    let ageMins = 0;
    if(msg.timestamp) {
        ageMins = (Date.now() - msg.timestamp.toMillis()) / 60000;
    }
    const canEditDelete = isMe && ageMins < 5;

    document.getElementById('ctx-edit').style.display = canEditDelete && msg.type==='text' ? 'block' : 'none';
    document.getElementById('ctx-delete-everyone').style.display = canEditDelete ? 'block' : 'none';

    // Update Star Text
    const isStarred = msg.starredBy && msg.starredBy.includes(state.currentUser.uid);
    document.getElementById('ctx-star').innerHTML = isStarred ? '<i class="fas fa-star-half-alt"></i> Unstar' : '<i class="fas fa-star"></i> Star';

    DOM.contextMenu.style.left = `${e.pageX}px`;
    DOM.contextMenu.style.top = `${e.pageY}px`;
    DOM.contextMenu.classList.remove('hidden');
};

document.addEventListener('click', () => { DOM.contextMenu.classList.add('hidden'); DOM.chatOptionsMenu.classList.add('hidden'); });

document.getElementById('ctx-reply').addEventListener('click', () => {
    const msg = state.messages.find(m => m.id === state.contextMenuTargetId);
    if(msg) {
        state.replyingToMsgId = msg.id;
        DOM.replyUser.textContent = msg.senderId === state.currentUser.uid ? 'You' : DOM.chatName.textContent;
        DOM.replyText.textContent = msg.text || 'Media';
        DOM.replyContainer.classList.remove('hidden');
        DOM.messageInput.focus();
    }
    DOM.contextMenu.classList.add('hidden');
});

DOM.cancelReply.addEventListener('click', () => { state.replyingToMsgId = null; DOM.replyContainer.classList.add('hidden'); });

document.getElementById('ctx-edit').addEventListener('click', () => {
    const msg = state.messages.find(m => m.id === state.contextMenuTargetId);
    if(msg && msg.type === 'text') {
        state.editingMsgId = msg.id;
        DOM.messageInput.value = msg.text;
        DOM.messageInput.focus();
    }
    DOM.contextMenu.classList.add('hidden');
});

document.getElementById('ctx-star').addEventListener('click', async () => {
    const msg = state.messages.find(m => m.id === state.contextMenuTargetId);
    if(msg) {
        const msgRef = doc(db, `chats/${state.activeChatId}/messages/${msg.id}`);
        const isStarred = msg.starredBy && msg.starredBy.includes(state.currentUser.uid);
        let newStarredBy = msg.starredBy || [];
        if(isStarred) newStarredBy = newStarredBy.filter(id => id !== state.currentUser.uid);
        else newStarredBy.push(state.currentUser.uid);
        await updateDoc(msgRef, { starredBy: newStarredBy });
    }
    DOM.contextMenu.classList.add('hidden');
});

document.getElementById('ctx-delete-me').addEventListener('click', async () => {
    const msg = state.messages.find(m => m.id === state.contextMenuTargetId);
    if(msg) {
        const msgRef = doc(db, `chats/${state.activeChatId}/messages/${msg.id}`);
        const newDeletedFor = msg.deletedFor || [];
        newDeletedFor.push(state.currentUser.uid);
        await updateDoc(msgRef, { deletedFor: newDeletedFor });
    }
    DOM.contextMenu.classList.add('hidden');
});

document.getElementById('ctx-delete-everyone').addEventListener('click', async () => {
    const msg = state.messages.find(m => m.id === state.contextMenuTargetId);
    if(msg) {
        await updateDoc(doc(db, `chats/${state.activeChatId}/messages/${msg.id}`), {
            isDeleted: true, text: '', mediaUrl: null
        });
    }
    DOM.contextMenu.classList.add('hidden');
});

// --- Chat Search ---
DOM.chatSearchBtn.addEventListener('click', () => DOM.chatSearchBarContainer.classList.toggle('hidden'));
DOM.closeChatSearch.addEventListener('click', () => { 
    DOM.chatSearchBarContainer.classList.add('hidden');
    state.chatSearchQuery = '';
    DOM.chatSearchInput.value = '';
    renderMessages();
});
DOM.chatSearchInput.addEventListener('input', (e) => {
    state.chatSearchQuery = e.target.value;
    renderMessages();
});

// --- Chat Profile & Star ---
DOM.chatOptionsBtn.addEventListener('click', (e) => { e.stopPropagation(); DOM.chatOptionsMenu.classList.toggle('hidden'); });

DOM.viewProfileBtn.addEventListener('click', () => showProfileInfo());
DOM.chatDetailsBtn.addEventListener('click', () => showProfileInfo());

const showProfileInfo = async () => {
    if(state.activeChatData) {
        document.getElementById('info-name').textContent = state.activeChatData.name;
        document.getElementById('info-avatar').src = state.activeChatData.avatar;
        document.getElementById('info-status').textContent = state.activeChatData.isGroup ? `${state.activeChatData.participants?.length || 0} members` : (state.activeChatData.online ? 'Online' : state.activeChatData.lastSeen);
        
        const groupSec = document.getElementById('group-members-section');
        const actions = document.getElementById('info-actions');
        
        if (state.activeChatData.isGroup) {
            groupSec.classList.remove('hidden');
            const list = document.getElementById('group-members-list');
            list.innerHTML = 'Loading members...';
            
            const isAdmin = state.activeChatData.admins && state.activeChatData.admins.includes(state.currentUser.uid);
            
            const membersHtml = [];
            for (let uid of state.activeChatData.participants) {
                const userSnap = await getDoc(doc(db, 'users', uid));
                if (userSnap.exists()) {
                    const u = userSnap.data();
                    const isMemberAdmin = state.activeChatData.admins && state.activeChatData.admins.includes(uid);
                    const isMe = uid === state.currentUser.uid;
                    
                    let adminActions = '';
                    if (isAdmin && !isMe) {
                        adminActions = `
                            <div style="font-size:0.8rem; margin-top:3px;">
                                <button onclick="toggleGroupAdmin('${uid}')" style="background:none;border:none;color:var(--primary-color);cursor:pointer;margin-right:10px;">${isMemberAdmin ? 'Remove Admin' : 'Make Admin'}</button>
                                <button onclick="removeGroupMember('${uid}')" style="background:none;border:none;color:var(--danger-color);cursor:pointer;">Remove User</button>
                            </div>
                        `;
                    }
                    
                    membersHtml.push(`
                        <li style="display:flex; align-items:center; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid var(--border-color);">
                            <img src="${u.photoURL}" style="width:30px; height:30px; border-radius:50%; margin-right:10px;">
                            <div style="flex:1; text-align:left;">
                                <div style="display:flex; justify-content:space-between;">
                                    <span>${u.displayName} ${isMe ? '(You)' : ''}</span>
                                    ${isMemberAdmin ? '<span style="font-size:0.7rem; background:var(--primary-color); padding:2px 5px; border-radius:3px; color:#fff;">Admin</span>' : ''}
                                </div>
                                ${adminActions}
                            </div>
                        </li>
                    `);
                }
            }
            list.innerHTML = membersHtml.join('');
            
            actions.innerHTML = isAdmin ? `<button class="btn btn-primary btn-sm" onclick="promptAddGroupMember()"><i class="fas fa-user-plus"></i> Add Member</button>` : '';
        } else {
            groupSec.classList.add('hidden');
            actions.innerHTML = '';
        }
        
        document.getElementById('info-modal').classList.remove('hidden');
    }
};

window.toggleGroupAdmin = async (uid) => {
    if(!state.activeChatId) return;
    const chatRef = doc(db, 'chats', state.activeChatId);
    const chatSnap = await getDoc(chatRef);
    let admins = chatSnap.data().admins || [];
    if (admins.includes(uid)) admins = admins.filter(id => id !== uid);
    else admins.push(uid);
    await updateDoc(chatRef, { admins });
    state.activeChatData.admins = admins;
    showProfileInfo();
};

window.removeGroupMember = async (uid) => {
    if(!state.activeChatId) return;
    if(!confirm("Remove this user from the group?")) return;
    const chatRef = doc(db, 'chats', state.activeChatId);
    const chatSnap = await getDoc(chatRef);
    let parts = chatSnap.data().participants || [];
    parts = parts.filter(id => id !== uid);
    await updateDoc(chatRef, { participants: parts });
    state.activeChatData.participants = parts;
    if(state.activeChatData.admins && state.activeChatData.admins.includes(uid)) {
        await window.toggleGroupAdmin(uid);
    } else {
        showProfileInfo();
    }
};

window.promptAddGroupMember = () => {
    if(!state.activeChatId) return;
    document.getElementById('new-member-email').value = '';
    document.getElementById('add-member-modal').classList.remove('hidden');
};

document.getElementById('close-add-member-modal').addEventListener('click', () => {
    document.getElementById('add-member-modal').classList.add('hidden');
});

document.getElementById('confirm-add-member-btn').addEventListener('click', async () => {
    if(!state.activeChatId) return;
    const userName = document.getElementById('new-member-email').value.trim();
    if(!userName) {
        showToast('Please enter a name', 'error');
        return;
    }
    const btn = document.getElementById('confirm-add-member-btn');
    btn.disabled = true;
    
    const q = query(collection(db, 'users'), where('displayName', '==', userName));
    const snap = await getDocs(q);
    if(snap.empty) { 
        showToast("User not found.", "error"); 
        btn.disabled = false;
        return; 
    }
    
    const uid = snap.docs[0].data().uid;
    if(state.activeChatData.participants.includes(uid)) { 
        showToast("User is already in the group.", "error"); 
        btn.disabled = false;
        return; 
    }
    
    const chatRef = doc(db, 'chats', state.activeChatId);
    const chatSnap = await getDoc(chatRef);
    let parts = chatSnap.data().participants || [];
    parts.push(uid);
    await updateDoc(chatRef, { participants: parts });
    state.activeChatData.participants = parts;
    showProfileInfo();
    
    showToast("Member added successfully", "success");
    document.getElementById('add-member-modal').classList.add('hidden');
    btn.disabled = false;
});

if(document.getElementById('close-info-modal')) {
    document.getElementById('close-info-modal').addEventListener('click', () => document.getElementById('info-modal').classList.add('hidden'));
}

DOM.chatStarBtn.addEventListener('click', async () => {
    if(!state.activeChatId) return;
    const isFav = state.userProfileData.favorites?.includes(state.activeChatId);
    let newFavs = state.userProfileData.favorites || [];
    if(isFav) newFavs = newFavs.filter(id => id !== state.activeChatId);
    else newFavs.push(state.activeChatId);
    
    await updateDoc(doc(db, 'users', state.currentUser.uid), { favorites: newFavs });
    DOM.chatStarBtn.innerHTML = !isFav ? '<i class="fas fa-star" style="color:var(--warning-color);"></i>' : '<i class="far fa-star"></i>';
});

// --- Settings & UI ---
DOM.settingsBtn.addEventListener('click', () => DOM.settingsModal.classList.remove('hidden'));
DOM.closeSettings.addEventListener('click', () => DOM.settingsModal.classList.add('hidden'));

DOM.tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        DOM.tabBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.activeTab = e.target.dataset.tab;
        renderContacts();
    });
});

DOM.contactSearch.addEventListener('input', async (e) => {
    state.searchQuery = e.target.value.trim();
    if(state.searchQuery.length > 0) {
        const qStr = state.searchQuery.toLowerCase();
        const usersRef = collection(db, 'users');
        const snap = await getDocs(usersRef);
        
        const matchingUsers = [];
        snap.forEach(doc => {
            const data = doc.data();
            if(data.uid !== state.currentUser.uid && (data.displayName.toLowerCase().includes(qStr) || data.email.toLowerCase().includes(qStr))) {
                const existing = state.contacts.find(c => !c.isGroup && c.name === data.displayName);
                if(!existing) {
                    let lastSeen = '';
                    if(data.lastSeen) lastSeen = data.lastSeen.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    matchingUsers.push({
                        id: 'new_' + data.uid,
                        uid: data.uid,
                        name: data.displayName,
                        avatar: data.photoURL,
                        online: data.online,
                        lastSeen: lastSeen,
                        lastMsg: 'Start a conversation',
                        time: '',
                        unread: 0,
                        tab: 'active',
                        isFavorite: false,
                        isGroup: false,
                        isNew: true
                    });
                }
            }
        });
        state.searchedUsers = matchingUsers;
    } else {
        state.searchedUsers = [];
    }
    renderContacts();
});

DOM.themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.body.className = `${state.theme}-theme`;
    DOM.themeToggle.innerHTML = state.theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

const setupBrowserNotifications = () => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
};

// --- WebRTC Call Logic ---
const servers = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
};

let pc = null;
let localStream = null;
let remoteStream = null;
let callUnsub = null;
let callerCandidatesUnsub = null;
let calleeCandidatesUnsub = null;
let currentCallDocId = null;

const initCallUI = (type, isIncoming, name, avatar) => {
    DOM.callName.textContent = name;
    DOM.callAvatar.src = avatar;
    DOM.callModal.classList.remove('hidden');
    
    if (isIncoming) {
        DOM.callStatus.textContent = `Incoming ${type} Call...`;
        document.getElementById('call-animation-container').classList.remove('hidden');
        document.getElementById('answer-call-btn').classList.remove('hidden');
    } else {
        DOM.callStatus.textContent = `Starting ${type} Call...`;
        document.getElementById('call-animation-container').classList.remove('hidden');
        document.getElementById('answer-call-btn').classList.add('hidden');
    }
};

const setupMediaSources = async (isVideo) => {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Media devices not supported (insecure context?)");
        }
        localStream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
    } catch(err) {
        console.warn("Using mock stream due to permission/context error:", err);
        showToast("Using simulated call (Camera/Mic unavailable)", "warning");
        
        // Create a mock stream with canvas and oscillator for testing on HTTP
        const canvas = document.createElement('canvas');
        canvas.width = 640; canvas.height = 480;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#222'; ctx.fillRect(0,0,640,480);
        ctx.fillStyle = '#fff'; ctx.font = '30px Arial';
        ctx.fillText('No Camera', 250, 240);
        localStream = canvas.captureStream(30);
        
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const dst = audioCtx.createMediaStreamDestination();
        oscillator.connect(dst);
        oscillator.start();
        localStream.addTrack(dst.stream.getAudioTracks()[0]);
    }
    
    document.getElementById('local-video').srcObject = localStream;
    remoteStream = new MediaStream();
    document.getElementById('remote-video').srcObject = remoteStream;
};

const createPeerConnection = () => {
    pc = new RTCPeerConnection(servers);
    
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
        document.getElementById('call-animation-container').classList.add('hidden');
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        });
        DOM.callStatus.textContent = "Connected";
    };
};

window.startCall = async (type) => {
    if(!state.activeChatId) return;
    const isVideo = type === 'Video';
    currentCallDocId = state.activeChatId;
    
    initCallUI(type, false, state.activeChatData.name, state.activeChatData.avatar);
    
    try {
        await setupMediaSources(isVideo);
        createPeerConnection();

        const callDoc = doc(db, 'calls', currentCallDocId);
        const offerCandidates = collection(callDoc, 'callerCandidates');
        const answerCandidates = collection(callDoc, 'calleeCandidates');

        pc.onicecandidate = (event) => {
            if (event.candidate) addDoc(offerCandidates, event.candidate.toJSON());
        };

        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);

        const callData = {
            offer: { type: offerDescription.type, sdp: offerDescription.sdp },
            caller: state.currentUser.uid,
            callerName: state.userProfileData.displayName,
            callerAvatar: state.userProfileData.photoURL,
            type: type,
            timestamp: serverTimestamp()
        };
        await setDoc(callDoc, callData);

        callUnsub = onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if(!data) { cleanupCall(); return; } // Call ended
            if (!pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });

        calleeCandidatesUnsub = onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                }
            });
        });

    } catch(err) { console.error(err); }
};

document.getElementById('answer-call-btn').addEventListener('click', async () => {
    if(!currentCallDocId) return;
    document.getElementById('answer-call-btn').classList.add('hidden');
    DOM.callStatus.textContent = "Connecting...";
    
    const callDoc = doc(db, 'calls', currentCallDocId);
    const callData = (await getDoc(callDoc)).data();
    if(!callData) return;
    
    const isVideo = callData.type === 'Video';
    
    try {
        await setupMediaSources(isVideo);
        createPeerConnection();
        
        const offerCandidates = collection(callDoc, 'callerCandidates');
        const answerCandidates = collection(callDoc, 'calleeCandidates');

        pc.onicecandidate = (event) => {
            if (event.candidate) addDoc(answerCandidates, event.candidate.toJSON());
        };

        const offerDescription = callData.offer;
        await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        await updateDoc(callDoc, {
            answer: { type: answerDescription.type, sdp: answerDescription.sdp }
        });

        callerCandidatesUnsub = onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    let data = change.doc.data();
                    pc.addIceCandidate(new RTCIceCandidate(data));
                }
            });
        });
        
    } catch(err) { console.error(err); }
});

const cleanupCall = () => {
    if(pc) {
        pc.close();
        pc = null;
    }
    if(localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if(remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
    if(callUnsub) { callUnsub(); callUnsub = null; }
    if(callerCandidatesUnsub) { callerCandidatesUnsub(); callerCandidatesUnsub = null; }
    if(calleeCandidatesUnsub) { calleeCandidatesUnsub(); calleeCandidatesUnsub = null; }
    
    DOM.callModal.classList.add('hidden');
    document.getElementById('local-video').srcObject = null;
    document.getElementById('remote-video').srcObject = null;
    currentCallDocId = null;
};

if(DOM.voiceCallBtn) DOM.voiceCallBtn.addEventListener('click', () => startCall('Voice'));
if(DOM.videoCallBtn) DOM.videoCallBtn.addEventListener('click', () => startCall('Video'));

DOM.endCallBtn.addEventListener('click', async () => {
    if(currentCallDocId) {
        try { await deleteDoc(doc(db, 'calls', currentCallDocId)); } catch(e) {}
    }
    cleanupCall();
});

window.listenForCalls = () => {
    const q = query(collection(db, 'calls'));
    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const callData = change.doc.data();
                if(callData.caller !== state.currentUser.uid) {
                    const chat = state.contacts.find(c => c.id === change.doc.id);
                    if(chat) {
                        currentCallDocId = change.doc.id;
                        initCallUI(callData.type, true, callData.callerName, callData.callerAvatar);
                        
                        callUnsub = onSnapshot(doc(db, 'calls', currentCallDocId), (docSnap) => {
                            if(!docSnap.exists()) cleanupCall();
                        });
                    }
                }
            }
            if (change.type === 'removed') {
                if(change.doc.id === currentCallDocId) {
                    cleanupCall();
                }
            }
        });
    });
};
