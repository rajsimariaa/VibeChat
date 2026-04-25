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
    endCallBtn: document.getElementById('end-call-btn'),
    
    forwardModal: document.getElementById('forward-modal'),
    closeForwardModal: document.getElementById('close-forward-modal'),
    forwardContactsList: document.getElementById('forward-contacts-list'),
    
    backToSidebar: document.getElementById('back-to-sidebar')
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
    searchResults: [], // Store global search results here
    chatSearchQuery: '',
    unsubChats: null,
    unsubMessages: null
};

const MOCK_COMMUNITY_PASS = "MyPeople";

// --- Initialization ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        state.currentUser = user;
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
        
        updateDoc(userRef, { online: true });
        window.addEventListener('beforeunload', () => updateDoc(userRef, { online: false, lastSeen: serverTimestamp() }));
        
        onSnapshot(userRef, (doc) => {
            state.userProfileData = doc.data();
            if(DOM.userName) DOM.userName.textContent = state.userProfileData.displayName;
            if(DOM.userAvatar) DOM.userAvatar.src = state.userProfileData.photoURL;
            if(DOM.editName) DOM.editName.value = state.userProfileData.displayName;
            if(DOM.editBio) DOM.editBio.value = state.userProfileData.bio || '';
            if(DOM.editAvatar) DOM.editAvatar.src = state.userProfileData.photoURL;
        });

        DOM.loginForm?.classList.add('hidden');
        DOM.signupForm?.classList.add('hidden');
        DOM.secondaryAuthForm?.classList.remove('hidden');
        listenForCalls();
    } else {
        DOM.authContainer?.classList.remove('hidden');
        DOM.appContainer?.classList.add('hidden');
        DOM.secondaryAuthForm?.classList.add('hidden');
        DOM.loginForm?.classList.remove('hidden');
    }
});

// --- Auth Flow ---
DOM.showSignup?.addEventListener('click', () => { DOM.loginForm.classList.add('hidden'); DOM.signupForm.classList.remove('hidden'); });
DOM.showLogin?.addEventListener('click', () => { DOM.signupForm.classList.add('hidden'); DOM.loginForm.classList.remove('hidden'); });

DOM.loginBtn?.addEventListener('click', async () => {
    const originalText = DOM.loginBtn.innerHTML;
    DOM.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    DOM.loginBtn.disabled = true;
    try {
        await signInWithEmailAndPassword(auth, DOM.loginEmail.value, DOM.loginPass.value);
    } catch (error) { 
        console.error("Login error:", error);
        showToast(error.message.replace('Firebase: ', ''), 'error'); 
        DOM.loginBtn.innerHTML = originalText;
        DOM.loginBtn.disabled = false;
    }
});

DOM.loginPass?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') DOM.loginBtn.click();
});
DOM.loginEmail?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') DOM.loginBtn.click();
});

DOM.signupBtn?.addEventListener('click', async () => {
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

DOM.signupPass?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') DOM.signupBtn.click();
});

DOM.googleBtn?.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (error) { showToast(error.message, 'error'); }
});

DOM.communityBtn?.addEventListener('click', () => {
    if(DOM.communityPass.value === MOCK_COMMUNITY_PASS) {
        state.communityVerified = true;
        DOM.authContainer.classList.add('hidden');
        DOM.appContainer.classList.remove('hidden');
        loadChats();
        listenForCalls();
        showToast('Authentication successful', 'success');
        setupBrowserNotifications();
        requestMediaPermissions();
        
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                document.body.style.height = `${window.visualViewport.height}px`;
                if(DOM.messagesContainer) DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
            });
        }
    } else { 
        showToast('Invalid community password', 'error'); 
    }
});

DOM.communityPass?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') DOM.communityBtn.click();
});

const requestMediaPermissions = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(t => t.stop());
    } catch(err) {
        console.log("Media permissions denied", err);
    }
};

DOM.logoutBtn?.addEventListener('click', async () => {
    if(state.currentUser) await updateDoc(doc(db, 'users', state.currentUser.uid), { online: false, lastSeen: serverTimestamp() });
    await signOut(auth);
    window.location.reload();
});

DOM.deleteAccountBtn?.addEventListener('click', async () => {
    if(confirm('Are you sure you want to delete your account? This cannot be undone.')) {
        try {
            await deleteDoc(doc(db, 'users', state.currentUser.uid));
            await deleteUser(state.currentUser);
            window.location.reload();
        } catch (e) { showToast(e.message, 'error'); }
    }
});

// --- Profile & Avatar ---
DOM.avatarEditBtn?.addEventListener('click', () => DOM.avatarUploadInput.click());
DOM.avatarUploadInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 800000) {
        showToast('Image too large (Max 800KB)', 'error');
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

DOM.saveProfileBtn?.addEventListener('click', async () => {
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
            if(isFav) tab = 'friends';

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
    if(state.activeTab === 'calls') {
        renderCallHistory();
        return;
    }

    let filtered = state.contacts;
    if(state.activeTab !== 'active') {
        if(state.activeTab === 'unread') filtered = filtered.filter(c => c.unread > 0);
        else filtered = filtered.filter(c => c.tab === state.activeTab);
    }
    if(state.searchQuery) {
        filtered = filtered.filter(c => (c.name || '').toLowerCase().includes(state.searchQuery.toLowerCase()));
        
        // Include global search results
        if(state.searchResults.length > 0) {
            filtered = [...state.searchResults, ...filtered];
        }
    }

    DOM.contactsList.innerHTML = '';
    let totalUnread = state.contacts.reduce((acc, c) => acc + c.unread, 0);
    if(DOM.unreadBadge) {
        DOM.unreadBadge.textContent = totalUnread;
        DOM.unreadBadge.classList.toggle('hidden', totalUnread === 0);
    }

    if(filtered.length === 0) {
        DOM.contactsList.innerHTML = `<div class="p-8 text-center text-slate-500 opacity-50"><i class="fas fa-users-slash text-4xl mb-2"></i><p>No contacts found</p></div>`;
        return;
    }

    filtered.forEach(contact => {
        const div = document.createElement('div');
        div.className = `contact-item flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-800/50 transition-all border-b border-white/5 ${state.activeChatId === contact.id ? 'bg-indigo-600/10 border-l-4 border-l-indigo-600 active' : ''}`;
        div.innerHTML = `
            <div class="avatar-wrapper relative flex-shrink-0">
                <img src="${contact.avatar}" class="w-12 h-12 rounded-full object-cover border border-white/10" alt="Avatar">
                ${contact.online && !contact.isGroup ? `<span class="status-indicator absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>` : ''}
            </div>
            <div class="contact-info flex-1 min-width-0 overflow-hidden">
                <div class="contact-header flex justify-between items-center mb-1">
                    <span class="contact-name text-sm font-bold text-white truncate">${contact.name} ${contact.isFavorite ? '<i class="fas fa-star text-amber-400 text-[10px]"></i>' : ''}</span>
                    <span class="contact-time text-[10px] text-slate-500 font-medium">${contact.time}</span>
                </div>
                <div class="contact-msg text-xs text-slate-400 truncate">${contact.lastMsg}</div>
            </div>
            <div class="contact-meta flex flex-col items-end gap-1">
                ${contact.unread > 0 ? `<span class="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-lg shadow-indigo-500/20">${contact.unread}</span>` : ''}
            </div>
        `;
        div.addEventListener('click', () => openChat(contact));
        DOM.contactsList.appendChild(div);
    });
};

const openChat = async (contact) => {
    if(contact.isNew) {
        showToast("Starting new chat...", "info");
        const docRef = await addDoc(collection(db, 'chats'), {
            participants: [state.currentUser.uid, contact.uid],
            isGroup: false,
            lastMessage: 'Conversation started',
            lastMessageTime: serverTimestamp(),
            unreadCount: {}
        });
        contact.id = docRef.id;
        contact.isNew = false;
        state.searchQuery = '';
        if(DOM.contactSearch) DOM.contactSearch.value = '';
    }

    if(state.unsubMessages) state.unsubMessages();
    state.activeChatId = contact.id;
    state.activeChatData = contact;
    
    DOM.noChatSelected?.classList.add('hidden');
    DOM.activeChat?.classList.remove('hidden');
    
    if(DOM.chatName) DOM.chatName.textContent = contact.name;
    if(DOM.chatAvatar) DOM.chatAvatar.src = contact.avatar;
    if(DOM.chatStatus) DOM.chatStatus.textContent = contact.isGroup ? 'Group Chat' : (contact.online ? 'Online' : contact.lastSeen);
    if(DOM.chatOnlineIndicator) DOM.chatOnlineIndicator.className = `status-indicator ${contact.online && !contact.isGroup ? 'online' : 'hidden'}`;
    if(DOM.chatStarBtn) DOM.chatStarBtn.innerHTML = contact.isFavorite ? '<i class="fas fa-star text-amber-400"></i>' : '<i class="far fa-star"></i>';
    
    if(contact.unread > 0) {
        const chatRef = doc(db, 'chats', contact.id);
        const chatSnap = await getDoc(chatRef);
        if(chatSnap.exists()) {
            const currentUnread = chatSnap.data().unreadCount || {};
            currentUnread[state.currentUser.uid] = 0;
            await updateDoc(chatRef, { unreadCount: currentUnread });
        }
    }

    if(window.innerWidth <= 768) DOM.sidebar.classList.add('hidden');

    const q = query(collection(db, `chats/${contact.id}/messages`), orderBy('timestamp', 'asc'));
    state.unsubMessages = onSnapshot(q, (snapshot) => {
        state.messages = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        renderMessages();
    });
};

DOM.backToSidebar?.addEventListener('click', () => {
    DOM.sidebar.classList.remove('hidden');
});

const renderMessages = () => {
    DOM.messagesContainer.innerHTML = '';
    state.messages.forEach(msg => {
        if(msg.deletedFor && msg.deletedFor.includes(state.currentUser.uid)) return;
        const isMe = msg.senderId === state.currentUser.uid;
        const div = document.createElement('div');
        div.className = `message-wrapper ${isMe ? 'sent' : 'received'}`;
        div.dataset.id = msg.id;
        
        let contentHtml = '';
        if(msg.isDeleted) {
             contentHtml = `<div class="message-bubble opacity-50 italic text-sm py-2 px-3 rounded-lg border border-white/10 bg-slate-800/50"><i class="fas fa-ban"></i> This message was deleted.</div>`;
        } else {
             let replyHtml = '';
             if(msg.replyTo) {
                  const repMsg = state.messages.find(m => m.id === msg.replyTo);
                  replyHtml = `<div class="bg-black/20 border-l-2 border-indigo-400 p-2 mb-2 rounded text-xs opacity-80">Replying to: ${repMsg ? (repMsg.text || 'Media') : 'Deleted'}</div>`;
              }
             
             if(msg.type === 'voice') {
                 contentHtml = `<div class="message-bubble p-2 rounded-2xl ${isMe ? 'bg-indigo-600' : 'bg-slate-800'}"><audio controls src="${msg.mediaUrl}" class="h-10 w-[240px] mix-blend-screen"></audio></div>`;
             } else if(msg.type === 'image') {
                 contentHtml = `<div class="message-bubble p-1 rounded-2xl ${isMe ? 'bg-indigo-600' : 'bg-slate-800'}"><img src="${msg.mediaUrl}" class="max-w-[200px] md:max-w-[280px] rounded-xl"/></div>`;
             } else {
                 contentHtml = `<div class="message-bubble px-4 py-2.5 rounded-2xl ${isMe ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-100'}">${replyHtml}<div class="text-sm md:text-base leading-relaxed break-words">${msg.text}</div></div>`;
             }
        }
        
        let timeStr = msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...';
        div.innerHTML = `${contentHtml}<div class="message-info"><span>${timeStr}</span></div>`;
        DOM.messagesContainer.appendChild(div);
    });
    DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
};

const cancelReplyHandler = () => {
    state.replyingToMsgId = null;
    DOM.replyContainer?.classList.add('hidden');
};
DOM.cancelReply?.addEventListener('click', cancelReplyHandler);

const sendMessage = async (text, type = 'text', mediaUrl = null) => {
    if(!text && !mediaUrl) return;
    if(!state.activeChatId) return;

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
        cancelReplyHandler();
    }

    try {
        await addDoc(collection(db, `chats/${state.activeChatId}/messages`), newMsg);
        DOM.messageInput.value = '';
        DOM.emojiPicker?.classList.add('hidden');
        await updateDoc(doc(db, 'chats', state.activeChatId), {
            lastMessage: type === 'text' ? text : type,
            lastMessageTime: serverTimestamp()
        });
    } catch(e) { showToast(e.message, 'error'); }
};

DOM.sendBtn?.addEventListener('click', () => sendMessage(DOM.messageInput.value.trim()));
DOM.messageInput?.addEventListener('keypress', (e) => { if(e.key === 'Enter') DOM.sendBtn.click(); });

document.getElementById('new-chat-btn')?.addEventListener('click', () => {
    DOM.contactSearch?.focus();
    DOM.contactSearch.value = '';
    state.searchQuery = '';
    state.searchResults = [];
    showToast("Type an email to find someone", "info");
    renderContacts();
});

DOM.contactSearch?.addEventListener('input', async (e) => {
    state.searchQuery = e.target.value;
    if(state.searchQuery.length < 3) {
        state.searchResults = [];
        renderContacts();
        return;
    }
    renderContacts();
    
    try {
        let q;
        if(state.searchQuery.includes('@')) {
            q = query(collection(db, 'users'), where('email', '==', state.searchQuery.trim()));
        } else {
            // Case-sensitive prefix search (Firestore limitation)
            q = query(collection(db, 'users'), 
                where('displayName', '>=', state.searchQuery), 
                where('displayName', '<=', state.searchQuery + '\uf8ff'),
                limit(5)
            );
        }
        
        const snap = await getDocs(q);
        state.searchResults = [];
        snap.forEach(d => {
            const userData = d.data();
            if(userData.uid !== state.currentUser.uid && !state.contacts.find(c => c.participants?.includes(userData.uid))) {
                state.searchResults.push({
                    id: 'new-' + userData.uid,
                    uid: userData.uid,
                    name: userData.displayName + ' (New)',
                    avatar: userData.photoURL,
                    online: userData.online,
                    lastMsg: 'Found on VibeChat! Click to chat.',
                    time: '',
                    isNew: true
                });
            }
        });
        renderContacts();
    } catch(e) { console.error("Global search error:", e); }
});

// In-chat search
DOM.chatSearchInput?.addEventListener('input', (e) => {
    state.chatSearchQuery = e.target.value;
    renderMessages();
});

DOM.chatSearchBtn?.addEventListener('click', () => {
    DOM.chatSearchBarContainer?.classList.toggle('hidden');
    DOM.chatSearchInput?.focus();
});

DOM.closeChatSearch?.addEventListener('click', () => {
    DOM.chatSearchBarContainer?.classList.add('hidden');
    state.chatSearchQuery = '';
    renderMessages();
});

// --- Tab Switching ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active', 'bg-indigo-600', 'text-white', 'shadow-lg');
            b.classList.add('bg-slate-800', 'text-slate-400');
        });
        btn.classList.add('active', 'bg-indigo-600', 'text-white', 'shadow-lg');
        btn.classList.remove('bg-slate-800', 'text-slate-400');
        state.activeTab = btn.dataset.tab;
        renderContacts();
    });
});

// --- Calling System ---
let localStream, remoteStream, pc, currentCallDocId, callTimerInterval, callStartTime;
let isAudioMuted = false, isVideoOff = false, currentFacingMode = 'user';

const servers = { iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }], iceCandidatePoolSize: 10 };

const createPeerConnection = async () => {
    pc = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    pc.ontrack = (event) => {
        remoteStream = event.streams[0];
        document.getElementById('remote-video').srcObject = remoteStream;
        startCallTimer();
    };
    return pc;
};

const startCallTimer = () => {
    clearInterval(callTimerInterval);
    callStartTime = Date.now();
    callTimerInterval = setInterval(() => {
        const diff = Math.floor((Date.now() - callStartTime) / 1000);
        const mins = Math.floor(diff / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        document.getElementById('call-timer').textContent = `${mins}:${secs}`;
    }, 1000);
};

const startCall = async (type) => {
    if(!state.activeChatData) return;
    const otherUid = state.activeChatData.participants.find(p => p !== state.currentUser.uid);
    
    localStream = await navigator.mediaDevices.getUserMedia({ video: type === 'Video', audio: true });
    document.getElementById('local-video').srcObject = localStream;
    
    DOM.callModal.classList.remove('hidden');
    DOM.callName.textContent = state.activeChatData.name;
    DOM.callAvatar.src = state.activeChatData.avatar;
    DOM.callStatus.textContent = 'Ringing...';
    
    await createPeerConnection();
    
    const callRef = doc(collection(db, 'calls'));
    currentCallDocId = callRef.id;
    
    pc.onicecandidate = (event) => {
        if (event.candidate) addDoc(collection(callRef, 'callerCandidates'), event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    await setDoc(callRef, {
        offer: { type: offerDescription.type, sdp: offerDescription.sdp },
        caller: state.currentUser.uid,
        callee: otherUid,
        type: type,
        timestamp: serverTimestamp()
    });

    onSnapshot(callRef, (snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
            pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            DOM.callStatus.textContent = 'Connected';
        }
    });

    onSnapshot(collection(callRef, 'calleeCandidates'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        });
    });
};

const listenForCalls = () => {
    if(!state.currentUser) return;
    const q = query(collection(db, 'calls'), where('callee', '==', state.currentUser.uid));
    onSnapshot(q, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                if(data.answer) return;
                currentCallDocId = change.doc.id;
                
                const userSnap = await getDoc(doc(db, 'users', data.caller));
                const userData = userSnap.data();
                
                DOM.callModal.classList.remove('hidden');
                DOM.callName.textContent = userData.displayName;
                DOM.callAvatar.src = userData.photoURL;
                DOM.callStatus.textContent = `Incoming ${data.type} Call...`;
                document.getElementById('answer-call-btn').classList.remove('hidden');
                
                document.getElementById('answer-call-btn').onclick = async () => {
                    localStream = await navigator.mediaDevices.getUserMedia({ video: data.type === 'Video', audio: true });
                    document.getElementById('local-video').srcObject = localStream;
                    await createPeerConnection();
                    
                    const callRef = doc(db, 'calls', currentCallDocId);
                    pc.onicecandidate = (event) => {
                        if (event.candidate) addDoc(collection(callRef, 'calleeCandidates'), event.candidate.toJSON());
                    };

                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    const answerDescription = await pc.createAnswer();
                    await pc.setLocalDescription(answerDescription);

                    await updateDoc(callRef, { answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

                    onSnapshot(collection(callRef, 'callerCandidates'), (snapshot) => {
                        snapshot.docChanges().forEach((change) => {
                            if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                        });
                    });
                    
                    document.getElementById('answer-call-btn').classList.add('hidden');
                    DOM.callStatus.textContent = 'Connected';
                };
            }
            if (change.type === 'removed' && change.doc.id === currentCallDocId) cleanupCall();
        });
    });
};

const cleanupCall = () => {
    clearInterval(callTimerInterval);
    if(localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    if(pc) { pc.close(); pc = null; }
    DOM.callModal.classList.add('hidden');
    document.getElementById('local-video').srcObject = null;
    document.getElementById('remote-video').srcObject = null;
};

DOM.endCallBtn?.addEventListener('click', async () => {
    if(currentCallDocId) {
        await deleteDoc(doc(db, 'calls', currentCallDocId));
        cleanupCall();
    }
});

DOM.voiceCallBtn?.addEventListener('click', () => startCall('Voice'));
DOM.videoCallBtn?.addEventListener('click', () => startCall('Video'));

// Call Controls
document.getElementById('toggle-mute-btn')?.addEventListener('click', () => {
    if(!localStream) return;
    isAudioMuted = !isAudioMuted;
    localStream.getAudioTracks().forEach(t => t.enabled = !isAudioMuted);
    const btn = document.getElementById('toggle-mute-btn');
    btn.classList.toggle('bg-red-500', isAudioMuted);
    btn.innerHTML = `<i class="fas fa-microphone${isAudioMuted ? '-slash' : ''}"></i>`;
    showToast(isAudioMuted ? 'Muted' : 'Unmuted', 'info');
});

document.getElementById('toggle-video-btn')?.addEventListener('click', () => {
    if(!localStream) return;
    isVideoOff = !isVideoOff;
    localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
    const btn = document.getElementById('toggle-video-btn');
    btn.classList.toggle('bg-red-500', isVideoOff);
    btn.innerHTML = `<i class="fas fa-video${isVideoOff ? '-slash' : ''}"></i>`;
});

document.getElementById('switch-camera-btn')?.addEventListener('click', async () => {
    if(!localStream || !pc) return;
    try {
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingMode },
            audio: false
        });
        const newTrack = newStream.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if(sender) await sender.replaceTrack(newTrack);
        
        localStream.getVideoTracks().forEach(t => t.stop());
        localStream.addTrack(newTrack);
        document.getElementById('local-video').srcObject = localStream;
        showToast('Camera switched', 'info');
    } catch(e) { showToast('Camera switch failed', 'error'); }
});

document.getElementById('add-member-call-btn')?.addEventListener('click', () => {
    const email = prompt("Enter email to add to call:");
    if(email) showToast(`Invite sent to ${email}`, 'success');
});

const renderCallHistory = async () => {
    DOM.contactsList.innerHTML = '<div class="p-8 text-center text-slate-500"><i class="fas fa-spinner fa-spin mb-2"></i><p>Loading History...</p></div>';
    try {
        const q = query(collection(db, 'call_history'), where('participants', 'array-contains', state.currentUser.uid), limit(50));
        const snap = await getDocs(q);
        const sorted = snap.docs.sort((a,b) => (b.data().timestamp?.toMillis()||0) - (a.data().timestamp?.toMillis()||0));
        DOM.contactsList.innerHTML = '';
        for(let d of sorted) {
            const data = d.data();
            const otherUid = data.participants.find(p => p !== state.currentUser.uid);
            const userSnap = await getDoc(doc(db, 'users', otherUid));
            const userData = userSnap.data() || { displayName: 'Unknown', photoURL: '' };
            const div = document.createElement('div');
            div.className = 'flex items-center gap-3 p-4 hover:bg-slate-800/50 border-b border-white/5';
            div.innerHTML = `
                <img src="${userData.photoURL}" class="w-10 h-10 rounded-full object-cover">
                <div class="flex-1">
                    <h4 class="text-sm font-bold text-white">${userData.displayName}</h4>
                    <p class="text-[10px] text-slate-500">${data.type} • ${data.duration}s</p>
                </div>
                <button class="icon-btn" onclick="window.startDirectCall('${otherUid}', '${data.type}', '${userData.displayName}', '${userData.photoURL}')"><i class="fas ${data.type === 'Video' ? 'fa-video' : 'fa-phone'}"></i></button>
            `;
            DOM.contactsList.appendChild(div);
        }
    } catch(e) { DOM.contactsList.innerHTML = '<p class="p-8 text-center text-red-400">Error loading history</p>'; }
};

window.startDirectCall = async (uid, type, name, avatar) => {
    let chatId = state.contacts.find(c => !c.isGroup && c.participants.includes(uid))?.id;
    if(!chatId) {
        const docRef = await addDoc(collection(db, 'chats'), { participants: [state.currentUser.uid, uid], isGroup: false, lastMessage: "Call", lastMessageTime: serverTimestamp() });
        chatId = docRef.id;
    }
    state.activeChatId = chatId;
    state.activeChatData = { id: chatId, name, avatar, participants: [state.currentUser.uid, uid] };
    startCall(type);
};

DOM.settingsBtn?.addEventListener('click', () => DOM.settingsModal.classList.remove('hidden'));
DOM.closeSettings?.addEventListener('click', () => DOM.settingsModal.classList.add('hidden'));

// Helper to keep code alive even if some IDs are missing
Object.keys(DOM).forEach(key => { if(DOM[key] === null) console.warn(`Element with ID ${key} not found.`); });
