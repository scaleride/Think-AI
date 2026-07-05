// Register PWA Service Worker for Android APK Installability
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered successfully!', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Profile Management Logic
    const profileOverlay = document.getElementById('profile-setup-overlay');
    const setupNameInput = document.getElementById('setup-name-input');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const photoInput = document.getElementById('profile-photo-input');
    const avatarPreviewContainer = document.getElementById('avatar-preview-container');
    const avatarPreviewImg = document.getElementById('avatar-preview-img');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    
    const userDisplayName = document.getElementById('user-display-name');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const userAvatarInitial = document.getElementById('user-avatar-initial');

    let selectedAvatarData = localStorage.getItem('user_photo') || null;

    const updateSidebarProfile = () => {
        const name = localStorage.getItem('user_name') || 'User';
        const photo = localStorage.getItem('user_photo');
        
        if (userDisplayName) userDisplayName.textContent = name;
        if (photo && userAvatarImg) {
            userAvatarImg.src = photo;
            userAvatarImg.classList.remove('hidden');
            if (userAvatarInitial) userAvatarInitial.classList.add('hidden');
        } else if (userAvatarInitial) {
            userAvatarInitial.textContent = name.charAt(0).toUpperCase();
            userAvatarInitial.classList.remove('hidden');
            if (userAvatarImg) userAvatarImg.classList.add('hidden');
        }
    };

    // Check if profile exists
    if (!localStorage.getItem('user_name')) {
        profileOverlay?.classList.remove('hidden');
    } else {
        updateSidebarProfile();
    }

    // Avatar Selection Logic
    avatarPreviewContainer?.addEventListener('click', () => photoInput?.click());
    
    photoInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                selectedAvatarData = event.target.result;
                if (avatarPreviewImg) {
                    avatarPreviewImg.src = selectedAvatarData;
                    avatarPreviewImg.classList.remove('hidden');
                    avatarPlaceholder?.classList.add('hidden');
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Save Profile Logic
    saveProfileBtn?.addEventListener('click', () => {
        const name = setupNameInput?.value.trim();
        if (!name) {
            alert('Please enter your name');
            return;
        }

        localStorage.setItem('user_name', name);
        if (selectedAvatarData) {
            localStorage.setItem('user_photo', selectedAvatarData);
        }

        updateSidebarProfile();
        profileOverlay?.classList.add('hidden');
    });

    // State Management
    const savedChats = JSON.parse(localStorage.getItem('think_ai_chats') || '[]');
    const state = {
        isSidebarCollapsed: false,
        activeModel: 'Think-Chat',
        isWebSearchEnabled: false,
        isVoiceInputActive: false,
        activeChatId: null,
        chats: savedChats,
        currentTheme: 'light', // 'light', 'dark', or 'neon'
        isAIProcessing: false,
        activeMood: null,
        moodIntensities: {
            Friendly: 50, Angry: 50, Emotional: 50, Romantic: 50,
            Funny: 50, Serious: 50, Sad: 50, Happy: 50
        }
    };

    const saveChats = () => {
        localStorage.setItem('think_ai_chats', JSON.stringify(state.chats));
    };

    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const plusMenuBtn = document.getElementById('plus-menu-btn');
    const plusMenu = document.getElementById('plus-menu');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const modelSelector = document.getElementById('model-selector');
    const modelDropdown = document.getElementById('model-dropdown');
    const initialState = document.getElementById('initial-state');
    const newChatBtn = document.getElementById('new-chat-btn');
    const historyContainer = document.getElementById('history-container');
    const emptyHistory = document.getElementById('empty-history');
    const topMenuTrigger = document.getElementById('top-menu-trigger');
    const topMenu = document.getElementById('top-history-menu');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const mainLogo = document.getElementById('main-logo');
    const moodSuggestion = document.getElementById('mood-suggestion');
    const moodModifierScreen = document.getElementById('mood-modifier-screen');
    const moodBackBtn = document.getElementById('mood-back-btn');
    const moodIntensitySlider = document.getElementById('mood-intensity');
    const intensityValLabel = document.getElementById('intensity-val');
    const moodConfirmBtn = document.getElementById('mood-confirm-btn');

    // Sidebar Toggle (Desktop)
    toggleSidebarBtn?.addEventListener('click', () => {
        state.isSidebarCollapsed = !state.isSidebarCollapsed;
        sidebar.classList.toggle('sidebar-collapsed', state.isSidebarCollapsed);
        toggleSidebarBtn.classList.toggle('collapsed', state.isSidebarCollapsed);
        const icon = toggleSidebarBtn.querySelector('i');
        if (icon) {
            icon.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            icon.style.transform = state.isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    });

    // Sidebar Toggle (Mobile)
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileBackdrop = document.getElementById('mobile-backdrop');

    const closeMobileSidebar = () => {
        if (window.innerWidth < 768) {
            sidebar.classList.add('-translate-x-full');
            mobileBackdrop?.classList.add('hidden');
        }
    };

    const toggleMobileSidebar = () => {
        sidebar.classList.toggle('-translate-x-full');
        mobileBackdrop?.classList.toggle('hidden');
    };

    mobileToggle?.addEventListener('click', toggleMobileSidebar);
    mobileBackdrop?.addEventListener('click', toggleMobileSidebar);

    // Dropdown Handlers
    settingsBtn?.addEventListener('click', (e) => { e.stopPropagation(); settingsDropdown.classList.toggle('show'); });
    topMenuTrigger?.addEventListener('click', (e) => { e.stopPropagation(); topMenu.classList.toggle('show'); });
    modelSelector?.addEventListener('click', (e) => { e.stopPropagation(); modelDropdown.classList.toggle('show'); });
    plusMenuBtn?.addEventListener('click', (e) => { e.stopPropagation(); plusMenu.classList.toggle('show'); });

    // Theme Logic (3-way toggle: Light -> Dark -> Neon)
    const toggleTheme = () => {
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        const toggleTrack = document.getElementById('toggle-track');
        const toggleThumb = document.getElementById('toggle-thumb');

        document.body.classList.remove('dark-mode', 'neon-mode');

        if (state.currentTheme === 'light') {
            state.currentTheme = 'dark';
            document.body.classList.add('dark-mode');
            themeIcon.setAttribute('data-lucide', 'moon');
            themeText.textContent = 'Dark Mode';
            toggleTrack.style.backgroundColor = '#1f2937';
            toggleThumb.style.left = '10px';
            if (mainLogo) mainLogo.src = 'logo_dark.jpg';
        } else if (state.currentTheme === 'dark') {
            state.currentTheme = 'neon';
            document.body.classList.add('neon-mode');
            themeIcon.setAttribute('data-lucide', 'zap');
            themeText.textContent = 'Neon Mode';
            toggleTrack.style.backgroundColor = '#ff5bf8';
            toggleThumb.style.left = '18px';
            if (mainLogo) mainLogo.src = 'logo_neon.png';
        } else {
            state.currentTheme = 'light';
            themeIcon.setAttribute('data-lucide', 'sun');
            themeText.textContent = 'Light Mode';
            toggleTrack.style.backgroundColor = '#e5e7eb';
            toggleThumb.style.left = '2px';
            if (mainLogo) mainLogo.src = 'logo.png';
        }
        lucide.createIcons();
    };

    themeToggleBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleTheme(); });

    // Mood Modifier Logic
    const bindMoodModifier = () => {
        const trigger = document.getElementById('mood-suggestion');
        if (trigger) {
            trigger.onclick = (e) => {
                e.stopPropagation();
                moodModifierScreen.classList.remove('hidden');
            };
        }
    };

    moodBackBtn?.addEventListener('click', () => {
        moodModifierScreen.classList.add('hidden');
    });

    moodIntensitySlider?.addEventListener('input', (e) => {
        const val = e.target.value;
        if (state.activeMood) {
            state.moodIntensities[state.activeMood] = val;
            intensityValLabel.textContent = `${val}%`;
        }
    });

    document.querySelectorAll('.mood-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mood-option').forEach(b => b.classList.remove('border-[#ff5bf8]', 'bg-[#ff5bf8]/10'));
            btn.classList.add('border-[#ff5bf8]', 'bg-[#ff5bf8]/10');
            const selectedMood = btn.dataset.mood;
            state.activeMood = selectedMood;
            const savedIntensity = state.moodIntensities[selectedMood];
            moodIntensitySlider.value = savedIntensity;
            intensityValLabel.textContent = `${savedIntensity}%`;
        });
    });

    moodConfirmBtn?.addEventListener('click', () => {
        if (!state.activeMood) { alert("Please select a mood first!"); return; }
        const chat = state.chats.find(c => c.id === state.activeChatId);
        if (chat) {
            chat.mood = state.activeMood;
            chat.intensity = state.moodIntensities[state.activeMood];
            chat.hasModifiedMood = true;
        }
        saveChats();
        moodModifierScreen.classList.add('hidden');
        const trigger = document.getElementById('mood-suggestion');
        if (trigger) {
            trigger.classList.add('opacity-50', 'pointer-events-none');
            trigger.querySelector('p').textContent = `Active Mood: ${state.activeMood} (${state.moodIntensities[state.activeMood]}%)`;
        }
    });

    // Model Logic
    const updateModelSelection = (selectedOption) => {
        const model = selectedOption.dataset.model;
        state.activeModel = model;
        const selectorSpan = document.querySelector('#model-selector span');
        if (selectorSpan) selectorSpan.textContent = model;
        document.querySelectorAll('.model-option .check-icon').forEach(icon => icon.remove());
        const checkIcon = document.createElement('i');
        checkIcon.setAttribute('data-lucide', 'check');
        checkIcon.className = 'check-icon w-4 h-4 text-[#ff5bf8]';
        selectedOption.appendChild(checkIcon);

        // Sync with web search globe toggle
        const searchToggleBtn = document.getElementById('web-search-toggle');
        if (model === 'Think-Search') {
            state.isWebSearchEnabled = true;
            if (searchToggleBtn) {
                searchToggleBtn.classList.remove('text-gray-400');
                searchToggleBtn.classList.add('text-[#ff5bf8]', 'bg-[#ff5bf8]/10', 'shadow-[0_0_10px_rgba(255,91,248,0.2)]');
            }
        } else {
            state.isWebSearchEnabled = false;
            if (searchToggleBtn) {
                searchToggleBtn.classList.add('text-gray-400');
                searchToggleBtn.classList.remove('text-[#ff5bf8]', 'bg-[#ff5bf8]/10', 'shadow-[0_0_10px_rgba(255,91,248,0.2)]');
            }
        }

        lucide.createIcons();
        modelDropdown.classList.remove('show');
    };

    document.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', (e) => { e.stopPropagation(); updateModelSelection(option); });
    });

    // Web Search Globe Toggle Button Logic
    const searchToggleBtn = document.getElementById('web-search-toggle');
    searchToggleBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!state.isWebSearchEnabled) {
            // Store previous model if it wasn't already Think-Search
            if (state.activeModel !== 'Think-Search') {
                state.previousModel = state.activeModel;
            }
            const option = document.querySelector('.model-option[data-model="Think-Search"]');
            if (option) updateModelSelection(option);
        } else {
            // Restore previous model
            const prev = state.previousModel || 'Think-Chat';
            const option = document.querySelector(`.model-option[data-model="${prev}"]`);
            if (option) updateModelSelection(option);
        }
    });

    // Chat Rendering
    const renderChat = (chatId) => {
        const chat = state.chats.find(c => c.id === chatId);
        if (!chat) return;

        // Update Header Info
        const headerTitle = document.getElementById('active-chat-title');
        const pinIcon = document.getElementById('pinned-status-icon');
        if (headerTitle) headerTitle.textContent = chat.title || 'New Chat';
        if (pinIcon) pinIcon.classList.toggle('hidden', !chat.isPinned);

        chatContainer.innerHTML = '';
        if (chat.messages.length === 0) {
            chatContainer.appendChild(initialState);
            initialState.style.display = 'flex';
            bindMoodModifier();
            const trigger = document.getElementById('mood-suggestion');
            if (chat.hasModifiedMood) {
                if (trigger) {
                    trigger.classList.add('opacity-50', 'pointer-events-none');
                    trigger.querySelector('p').textContent = `Active Mood: ${chat.mood} (${chat.intensity}%)`;
                }
            } else {
                if (trigger) {
                    trigger.classList.remove('opacity-50', 'pointer-events-none');
                    trigger.querySelector('p').textContent = "Customize how I respond to you.";
                }
            }
        } else {
            initialState.style.display = 'none';
            chat.messages.forEach(msg => appendMessageToUI(msg.text, msg.isUser, false, false));
        }
        document.querySelectorAll('.chat-history-item').forEach(item => {
            const isActive = parseInt(item.dataset.id) === chatId;
            item.classList.toggle('bg-white', isActive);
            item.classList.toggle('shadow-sm', isActive);
            item.classList.toggle('border', isActive);
            const icon = item.querySelector('i:first-child');
            if (icon) { icon.classList.toggle('text-[#ff5bf8]', isActive); icon.classList.toggle('text-gray-400', !isActive); }
        });
        chatContainer.scrollTo({ top: chatContainer.scrollHeight });
        closeMobileSidebar();
    };

    // Actions
    const deleteChat = (chatId) => {
        state.chats = state.chats.filter(c => c.id !== chatId);
        saveChats();
        document.querySelector(`.chat-history-item[data-id="${chatId}"]`)?.remove();
        if (state.chats.length === 0) {
            if (emptyHistory) emptyHistory.style.display = 'block';
            startNewChat();
        } else if (state.activeChatId === chatId) {
            const nextChat = state.chats.find(c => c.messages.length > 0) || state.chats[0];
            if (nextChat) {
                state.activeChatId = nextChat.id;
                renderChat(nextChat.id);
            } else {
                startNewChat();
            }
        }
    };

    const renameChat = (chatId) => {
        const chat = state.chats.find(c => c.id === chatId);
        const newTitle = prompt("Enter new title:", chat.title);
        if (newTitle?.trim()) {
            chat.title = newTitle.trim();
            saveChats();
            const span = document.querySelector(`.chat-history-item[data-id="${chatId}"] span`);
            if (span) span.textContent = chat.title;
            // Update header if active
            if (state.activeChatId === chatId) {
                const headerTitle = document.getElementById('active-chat-title');
                if (headerTitle) headerTitle.textContent = chat.title;
            }
        }
    };

    const pinChat = (chatId) => {
        const chat = state.chats.find(c => c.id === chatId);
        const item = document.querySelector(`.chat-history-item[data-id="${chatId}"]`);
        if (!item) return;
        chat.isPinned = !chat.isPinned;
        saveChats();
        item.classList.toggle('pinned-item', chat.isPinned);
        const icon = item.querySelector('i:first-child');
        if (icon) { icon.setAttribute('data-lucide', chat.isPinned ? 'pin' : 'message-square'); icon.classList.toggle('text-[#ff5bf8]', chat.isPinned); }
        const pinAction = item.querySelector('.action-pin');
        if (pinAction) pinAction.innerHTML = chat.isPinned ? '<i data-lucide="pin-off" class="w-3 h-3"></i> Unpin' : '<i data-lucide="pin" class="w-3 h-3"></i> Pin';
        
        // Update header if active
        if (state.activeChatId === chatId) {
            const pinIcon = document.getElementById('pinned-status-icon');
            if (pinIcon) pinIcon.classList.toggle('hidden', !chat.isPinned);
        }

        refreshHistoryList();
    };

    const refreshHistoryList = () => {
        // Keep the "History" label and "Empty History" message
        const label = historyContainer.children[0];
        const empty = document.getElementById('empty-history');
        
        // Clear all except label and empty message
        Array.from(historyContainer.children).forEach(child => {
            if (child !== label && child !== empty) child.remove();
        });

        // Filter and Sort: Pinned first, then by ID (newest first)
        const chatsToDisplay = state.chats
            .filter(c => c.messages && c.messages.length > 0)
            .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return b.id - a.id;
            });

        if (chatsToDisplay.length === 0) {
            if (empty) empty.style.display = 'block';
        } else {
            if (empty) empty.style.display = 'none';
            // Use appendChild instead of insertBefore since we sorted them
            chatsToDisplay.forEach(chat => addToHistoryUI(chat, false));
        }
        lucide.createIcons();
    };

    // UI History
    const addToHistoryUI = (chat, isPrepend = true) => {
        if (emptyHistory) emptyHistory.style.display = 'none';
        const historyItem = document.createElement('div');
        historyItem.dataset.id = chat.id;
        historyItem.className = `chat-history-item group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-white/50 animate-enter relative ${parseInt(historyItem.dataset.id) === state.activeChatId ? 'bg-white shadow-sm border' : ''}`;
        
        historyItem.innerHTML = `
            <i data-lucide="${chat.isPinned ? 'pin' : 'message-square'}" class="w-4 h-4 ${chat.isPinned ? 'text-[#ff5bf8]' : 'text-gray-400'}"></i>
            <span class="flex-1 text-sm truncate text-gray-500">${chat.title}</span>
            <div class="relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="menu-trigger p-1 hover:bg-gray-200 rounded-md"><i data-lucide="more-horizontal" class="w-4 h-4 text-gray-400"></i></button>
                <div class="history-menu dropdown-content absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl z-[100] w-32 p-1">
                    <button class="action-rename w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-md"><i data-lucide="edit-2" class="w-3 h-3"></i> Rename</button>
                    <button class="action-pin w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-md"><i data-lucide="${chat.isPinned ? 'pin-off' : 'pin'}" class="w-3 h-3"></i> ${chat.isPinned ? 'Unpin' : 'Pin'}</button>
                    <button class="action-share w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-md"><i data-lucide="share-2" class="w-3 h-3"></i> Share</button>
                    <div class="border-t border-gray-50 my-1"></div>
                    <button class="action-delete w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-md"><i data-lucide="trash-2" class="w-3 h-3"></i> Delete</button>
                </div>
            </div>
        `;
        if (chat.isPinned) historyItem.classList.add('pinned-item');
        
        historyItem.addEventListener('click', (e) => { if (!e.target.closest('.menu-trigger') && !e.target.closest('.history-menu')) { state.activeChatId = chat.id; renderChat(chat.id); } });
        const menuTrigger = historyItem.querySelector('.menu-trigger');
        const menu = historyItem.querySelector('.history-menu');
        menuTrigger.addEventListener('click', (e) => { e.stopPropagation(); document.querySelectorAll('.dropdown-content').forEach(m => { if (m !== menu) m.classList.remove('show'); }); menu.classList.toggle('show'); });
        historyItem.querySelector('.action-rename').addEventListener('click', (e) => { e.stopPropagation(); renameChat(chat.id); menu.classList.remove('show'); });
        historyItem.querySelector('.action-pin').addEventListener('click', (e) => { e.stopPropagation(); pinChat(chat.id); menu.classList.remove('show'); });
        historyItem.querySelector('.action-share').addEventListener('click', (e) => { e.stopPropagation(); alert("Link copied!"); menu.classList.remove('show'); });
        historyItem.querySelector('.action-delete').addEventListener('click', (e) => { e.stopPropagation(); deleteChat(chat.id); });
        
        if (isPrepend) {
            historyContainer.insertBefore(historyItem, historyContainer.children[1]);
        } else {
            historyContainer.appendChild(historyItem);
        }
        lucide.createIcons();
    };

    const startNewChat = () => {
        const currentChat = state.chats.find(c => c.id === state.activeChatId);
        if (currentChat && currentChat.messages.length === 0) { renderChat(state.activeChatId); return; }
        const newId = Date.now();
        const newChat = { id: newId, title: 'New Chat', messages: [], isAddedToHistory: false, isPinned: false, hasModifiedMood: false, mood: null, intensity: 50 };
        state.activeChatId = newId;
        state.chats.push(newChat);
        renderChat(newId);
        chatInput.value = '';
        chatInput.style.height = 'auto';
    };

    newChatBtn?.addEventListener('click', startNewChat);

    const appendMessageToUI = (text, isUser = true, saveToState = true, shouldStream = true) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex ${isUser ? 'flex-row-reverse' : ''} gap-4 message-enter`;
        
        const userName = localStorage.getItem('user_name') || 'User';
        const userPhoto = localStorage.getItem('user_photo');
        
        let avatar = '';
        if (isUser) {
            if (userPhoto) {
                avatar = `<div class="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden"><img src="${userPhoto}" alt="${userName}" class="w-full h-full object-cover"></div>`;
            } else {
                const initial = userName.charAt(0).toUpperCase();
                avatar = `<div class="w-8 h-8 rounded-full avatar-gradient flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-md">${initial}</div>`;
            }
        } else {
            avatar = `<div class="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden"><img src="ai_avatar.png" alt="Think AI" class="w-full h-full object-cover"></div>`;
        }
        
        const bubble = document.createElement('div');
        bubble.className = `px-5 py-3 ${isUser ? 'user-bubble text-white' : 'ai-bubble text-gray-700'} text-sm leading-relaxed`;
        msgDiv.innerHTML = avatar;
        const wrapper = document.createElement('div');
        wrapper.className = `flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : ''}`;
        wrapper.appendChild(bubble);

        // --- Copy Button ---
        const copyBtn = document.createElement('button');
        copyBtn.className = `copy-msg-btn flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 opacity-0 pointer-events-none ${isUser ? 'self-end text-white/70 hover:text-white hover:bg-white/20' : 'self-start text-gray-400 hover:text-[#ff5bf8] hover:bg-[#ff5bf8]/10'}`;
        copyBtn.setAttribute('title', 'Copy message');
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>`;
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(text).then(() => {
                copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span style="color: #4ade80">Copied!</span>`;
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>`;
                }, 2000);
            }).catch(() => {
                // Fallback for older browsers
                const el = document.createElement('textarea');
                el.value = text;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span style="color: #4ade80">Copied!</span>`;
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>`;
                }, 2000);
            });
        });
        wrapper.appendChild(copyBtn);

        // Show/hide copy button on hover
        msgDiv.addEventListener('mouseenter', () => {
            copyBtn.classList.remove('opacity-0', 'pointer-events-none');
            copyBtn.classList.add('opacity-100', 'pointer-events-auto');
        });
        msgDiv.addEventListener('mouseleave', () => {
            copyBtn.classList.add('opacity-0', 'pointer-events-none');
            copyBtn.classList.remove('opacity-100', 'pointer-events-auto');
        });
        // Touch support for mobile: toggle on tap of the bubble
        bubble.addEventListener('click', () => {
            const isHidden = copyBtn.classList.contains('opacity-0');
            document.querySelectorAll('.copy-msg-btn').forEach(b => {
                b.classList.add('opacity-0', 'pointer-events-none');
                b.classList.remove('opacity-100', 'pointer-events-auto');
            });
            if (isHidden) {
                copyBtn.classList.remove('opacity-0', 'pointer-events-none');
                copyBtn.classList.add('opacity-100', 'pointer-events-auto');
            }
        });

        msgDiv.appendChild(wrapper);
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });

        const formatContent = (content) => {
            // 1. Escape any raw HTML to prevent injection
            let formatted = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // 2. Convert **bold** markdown
            formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

            // 3. Convert `inline code`
            formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

            // 4. Convert URLs to clickable links (must come AFTER escaping)
            formatted = formatted.replace(
                /(https?:\/\/[^\s&<>"{}|\\^`[\]]+)/g,
                '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
            );

            // 5. Convert newlines to <br>
            formatted = formatted.replace(/\n/g, '<br>');

            return formatted;
        };

        if (!isUser && shouldStream) {
            state.isAIProcessing = true;
            updateSendButtonState();
            let i = 0;
            bubble.innerHTML = '';
            const interval = setInterval(() => {
                if (i < text.length) {
                    bubble.innerHTML += text[i] === '\n' ? '<br>' : text[i];
                    i++;
                    chatContainer.scrollTo({ top: chatContainer.scrollHeight });
                } else {
                    clearInterval(interval);
                    bubble.innerHTML = formatContent(text);
                    state.isAIProcessing = false;
                    updateSendButtonState();
                }
            }, 10);
        } else {
            bubble.innerHTML = formatContent(text);
        }

        if (saveToState && state.activeChatId) {
            const chat = state.chats.find(c => c.id === state.activeChatId);
            if (chat) {
                chat.messages.push({ text, isUser });
                if (isUser && chat.messages.length === 1) {
                    chat.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
                    if (!chat.isAddedToHistory) { addToHistoryUI(chat); chat.isAddedToHistory = true; }
                    renderChat(state.activeChatId);
                }
                saveChats();
            }
        }
    };

    const updateSendButtonState = () => {
        if (state.isVoiceInputActive) {
            sendBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'scale-95');
            sendBtn.classList.add('animate-mic-record');
            sendBtn.innerHTML = '<i data-lucide="mic" class="w-5 h-5 animate-mic-blink"></i>';
        } else {
            sendBtn.classList.remove('animate-mic-record');
            if (state.isAIProcessing) {
                sendBtn.classList.add('opacity-50', 'cursor-not-allowed', 'scale-95');
                sendBtn.innerHTML = '<i data-lucide="arrow-up" class="w-5 h-5 animate-arrow-up-loading"></i>';
            } else {
                sendBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'scale-95');
                sendBtn.innerHTML = '<i data-lucide="arrow-up" class="w-5 h-5"></i>';
            }
        }
        lucide.createIcons();
    };

    // Push Notification Utility (detects when user backgrounds/leaves page while waiting)
    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (e) {
                console.error("Failed to request notification permission:", e);
            }
        }
    };

    const sendPushNotification = (text) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const cleanText = text.replace(/\*\*([^*]+)\*\*/g, '$1')
                             .replace(/`([^`]+)`/g, '$1');
        const snippet = cleanText.substring(0, 100) + (cleanText.length > 100 ? '...' : '');

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Think AI', {
                    body: `Your answer is ready: "${snippet}"`,
                    icon: 'logo.png',
                    badge: 'logo.png',
                    vibrate: [200, 100, 200],
                    tag: 'think-ai-answer',
                    renotify: true
                });
            });
        } else {
            new Notification('Think AI', {
                body: `Your answer is ready: "${snippet}"`,
                icon: 'logo.png',
                tag: 'think-ai-answer'
            });
        }
    };

    // Pool of Gemini API keys for seamless automatic rotation on rate limits / errors
    const API_KEYS = [
        'AIzaSyDiR7pFjFXduRxZizWrAjTKq9Y241AIQug',
        'AIzaSyCCqaNWp37877iuGqvClEssjTtsb-AfWHg',
        'AIzaSyBeJ7p_-Pv5gY4UyEvEYt1BPICsCVaQKXM',
        'AIzaSyDW8Nf1FBL6WvOKFafhxUCZChJ6X-Yd7z4'
    ];
    let currentKeyIndex = parseInt(localStorage.getItem('think_ai_key_index') || '0');
    if (currentKeyIndex >= API_KEYS.length) {
        currentKeyIndex = 0;
        localStorage.setItem('think_ai_key_index', '0');
    }

    const callGeminiAPI = async (history) => {
        let attempts = 0;
        const maxAttempts = API_KEYS.length;

        while (attempts < maxAttempts) {
            const apiKey = API_KEYS[currentKeyIndex];
            console.log(`Sending API request using key index: ${currentKeyIndex}`);

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        contents: history,
                        systemInstruction: {
                            parts: [{ text: "You are Think AI, a helpful and natural-sounding AI assistant created by LYFT. Only mention that you were made by LYFT (stylized as LYF↑) when specifically asked about your origin or creator. Otherwise, respond naturally to greetings and questions." }]
                        },
                        safetySettings: [
                            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                        ]
                    })
                });

                const data = await response.json();

                // Check STRICTLY for rate limit (429), resource exhaustion (quota exceeded), or temporary high demand spikes
                const isLimitExceeded = data.error && (
                    response.status === 429 || 
                    data.error.code === 429 || 
                    data.error.status === 'RESOURCE_EXHAUSTED' || 
                    data.error.message.toLowerCase().includes('quota') || 
                    data.error.message.toLowerCase().includes('rate limit') || 
                    data.error.message.toLowerCase().includes('limit exceeded') ||
                    data.error.message.toLowerCase().includes('high demand') ||
                    data.error.message.toLowerCase().includes('temporary') ||
                    data.error.message.toLowerCase().includes('try again later') ||
                    data.error.message.toLowerCase().includes('overloaded')
                );

                if (isLimitExceeded) {
                    console.warn(`API key index ${currentKeyIndex} quota limit reached. Silently rotating key...`);
                    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
                    localStorage.setItem('think_ai_key_index', currentKeyIndex.toString());
                    attempts++;
                    continue; // Retry with next key in pool
                }

                // If it is another kind of error, just return it directly (do not rotate)
                if (data.error) {
                    return { error: data.error };
                }

                // Success!
                return { success: true, data: data };

            } catch (error) {
                console.error(`Network or fetch error with key index ${currentKeyIndex}:`, error);
                return { error: { message: error.message } };
            }
        }

        // If we got here, all keys in the pool were exhausted
        return { error: { message: "All Gemini API keys in the key rotation pool have reached their rate/quota limits. Please update your API keys." } };
    };

    const handleSend = async () => {
        if (state.isVoiceInputActive) {
            stopVoiceInput();
            return;
        }
        if (state.isAIProcessing) return;
        const text = chatInput.value.trim();
        if (text) {
            requestNotificationPermission(); // Silent request on explicit user click/send
            if (!state.activeChatId) startNewChat();
            const currentChat = state.chats.find(c => c.id === state.activeChatId);
            appendMessageToUI(text, true);
            chatInput.value = '';
            chatInput.style.height = 'auto';

            state.isAIProcessing = true;
            updateSendButtonState();

            try {
                // All models now use Gemini since other keys were removed
                const history = currentChat.messages.map(msg => ({
                    role: msg.isUser ? "user" : "model",
                    parts: [{ text: msg.text }]
                }));
                
                const result = await callGeminiAPI(history);
                state.isAIProcessing = false;

                if (result.error) {
                    updateSendButtonState();
                    appendMessageToUI(`⚠️ **API Error:** ${result.error.message}`, false);
                } else if (result.success && result.data.candidates && result.data.candidates.length > 0) {
                    const aiText = result.data.candidates[0].content.parts[0].text;
                    appendMessageToUI(aiText, false, true, false); // Instant display
                    updateSendButtonState();

                    // Send a push notification if the user has minimized/backgrounded the app while waiting!
                    if (document.visibilityState === 'hidden') {
                        sendPushNotification(aiText);
                    }
                } else {
                    updateSendButtonState();
                    appendMessageToUI("Sorry, I received an invalid response from the AI.", false);
                }
            } catch (error) {
                state.isAIProcessing = false;
                updateSendButtonState();
                appendMessageToUI(`⚠️ **Error:** ${error.message}`, false);
            }

            lucide.createIcons();
        }
    };

    sendBtn?.addEventListener('click', () => handleSend());
    chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });

    document.querySelector('.action-rename-active')?.addEventListener('click', () => { if (state.activeChatId) renameChat(state.activeChatId); topMenu.classList.remove('show'); });
    document.querySelector('.action-pin-active')?.addEventListener('click', () => { if (state.activeChatId) pinChat(state.activeChatId); topMenu.classList.remove('show'); });
    document.querySelector('.action-share-active')?.addEventListener('click', () => { alert("Link copied!"); topMenu.classList.remove('show'); });
    document.querySelector('.action-delete-active')?.addEventListener('click', () => { if (state.activeChatId) deleteChat(state.activeChatId); topMenu.classList.remove('show'); });

    window.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content').forEach(m => m.classList.remove('show'));
    });

    // Speech Recognition dictation setup (Dual Engine: Web & Native Capacitor)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let nativeListener = null;

    const getNativeSpeechPlugin = () => {
        return window.Capacitor?.Plugins?.SpeechRecognition;
    };

    const startVoiceInput = async () => {
        state.isVoiceInputActive = true;
        updateSendButtonState();
        if (voiceInputBtn) {
            voiceInputBtn.classList.remove('text-gray-400');
            voiceInputBtn.classList.add('text-[#ff5bf8]', 'bg-[#ff5bf8]/10');
        }

        const nativeSpeech = getNativeSpeechPlugin();
        if (nativeSpeech) {
            try {
                const { available } = await nativeSpeech.available();
                if (!available) {
                    alert("Speech recognition is not supported on this mobile device.");
                    await stopVoiceInput();
                    return;
                }
                const perm = await nativeSpeech.checkPermissions();
                if (perm.speechRecognition !== 'granted' || perm.microphone !== 'granted') {
                    const req = await nativeSpeech.requestPermissions();
                    if (req.speechRecognition !== 'granted' || req.microphone !== 'granted') {
                        alert("Microphone & Speech permissions are required for voice typing.");
                        await stopVoiceInput();
                        return;
                    }
                }

                if (nativeListener) {
                    await nativeListener.remove();
                }

                nativeListener = await nativeSpeech.addListener('partialResults', (data) => {
                    if (data && data.matches && data.matches.length > 0) {
                        const transcript = data.matches[0];
                        if (transcript) {
                            chatInput.value = transcript;
                            chatInput.dispatchEvent(new Event('input'));
                        }
                    }
                });

                await nativeSpeech.start({
                    language: "en-US",
                    partialResults: true,
                    popup: false
                });
            } catch (e) {
                console.error('Failed to start native speech:', e);
                await stopVoiceInput();
            }
        } else {
            // Fallback to web browser SpeechRecognition
            if (!recognition) {
                alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
                stopVoiceInput();
                return;
            }
            try {
                recognition.start();
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }
    };

    const stopVoiceInput = async () => {
        state.isVoiceInputActive = false;
        updateSendButtonState();
        if (voiceInputBtn) {
            voiceInputBtn.classList.add('text-gray-400');
            voiceInputBtn.classList.remove('text-[#ff5bf8]', 'bg-[#ff5bf8]/10');
        }

        const nativeSpeech = getNativeSpeechPlugin();
        if (nativeSpeech) {
            try {
                await nativeSpeech.stop();
                if (nativeListener) {
                    await nativeListener.remove();
                    nativeListener = null;
                }
            } catch (e) {
                console.error('Failed to stop native speech:', e);
            }
        } else if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                console.error('Failed to stop recognition:', e);
            }
        }
    };

    const toggleVoiceInput = () => {
        if (state.isVoiceInputActive) {
            stopVoiceInput();
        } else {
            startVoiceInput();
        }
    };

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                const currentText = chatInput.value;
                chatInput.value = currentText + (currentText ? ' ' : '') + finalTranscript;
                chatInput.dispatchEvent(new Event('input'));
            }
        };
        
        recognition.onend = () => {
            if (state.isVoiceInputActive) {
                stopVoiceInput();
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopVoiceInput();
        };
    }

    voiceInputBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleVoiceInput();
    });

    // Keyboard Handling for Mobile (Phone, Tab, TV, etc.)
    const inputContainer = document.getElementById('input-container');
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const viewport = window.visualViewport;
            const offset = window.innerHeight - viewport.height;
            
            if (offset > 50) { // Keyboard is likely shown
                inputContainer.style.bottom = `${offset}px`;
                // Add extra padding for small screens/watches
                if (window.innerWidth < 400) {
                    inputContainer.style.padding = '12px';
                }
            } else {
                inputContainer.style.bottom = '0';
                if (window.innerWidth < 400) {
                    inputContainer.style.padding = '24px';
                }
            }
            chatContainer.scrollTo({ top: chatContainer.scrollHeight });
        });
    }

    // Restore history on load
    const validChats = state.chats.filter(c => c.messages && c.messages.length > 0);
    if (validChats.length > 0) {
        validChats.forEach(chat => { chat.isAddedToHistory = true; });
        refreshHistoryList();
        const lastChat = validChats[validChats.length - 1];
        state.activeChatId = lastChat.id;
        renderChat(lastChat.id);
    } else {
        startNewChat();
    }
});
