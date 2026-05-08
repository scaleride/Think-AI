document.addEventListener('DOMContentLoaded', () => {
    // Authentication Check
    if (localStorage.getItem('think_ai_logged_in') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Lucide Icons
    lucide.createIcons();

    // State Management
    const savedChats = JSON.parse(localStorage.getItem('think_ai_chats') || '[]');
    const state = {
        isSidebarCollapsed: false,
        activeModel: 'Think-Chat',
        isWebSearchEnabled: false,
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

    // Logout Handler
    const signOutBtn = document.getElementById('sign-out-btn');
    signOutBtn?.addEventListener('click', () => {
        localStorage.removeItem('think_ai_logged_in');
        window.location.href = 'login.html';
    });

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
            if (mainLogo) mainLogo.src = 'logo_neon.jpg';
        } else {
            state.currentTheme = 'light';
            themeIcon.setAttribute('data-lucide', 'sun');
            themeText.textContent = 'Light Mode';
            toggleTrack.style.backgroundColor = '#e5e7eb';
            toggleThumb.style.left = '2px';
            if (mainLogo) mainLogo.src = 'logo.jpg';
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
        lucide.createIcons();
        modelDropdown.classList.remove('show');
    };

    document.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', (e) => { e.stopPropagation(); updateModelSelection(option); });
    });

    // Chat Rendering
    const renderChat = (chatId) => {
        const chat = state.chats.find(c => c.id === chatId);
        if (!chat) return;
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
        lucide.createIcons();
    };

    // UI History
    const addToHistoryUI = (chat) => {
        if (emptyHistory) emptyHistory.style.display = 'none';
        const historyItem = document.createElement('div');
        historyItem.dataset.id = chat.id;
        historyItem.className = 'chat-history-item group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-white/50 animate-enter relative';
        historyItem.innerHTML = `
            <i data-lucide="message-square" class="w-4 h-4 text-gray-400"></i>
            <span class="flex-1 text-sm truncate text-gray-500">${chat.title}</span>
            <div class="relative flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="menu-trigger p-1 hover:bg-gray-200 rounded-md"><i data-lucide="more-horizontal" class="w-4 h-4 text-gray-400"></i></button>
                <div class="history-menu dropdown-content absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl z-[100] w-32 p-1">
                    <button class="action-rename w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-md"><i data-lucide="edit-2" class="w-3 h-3"></i> Rename</button>
                    <button class="action-pin w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-md"><i data-lucide="pin" class="w-3 h-3"></i> Pin</button>
                    <button class="action-share w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded-md"><i data-lucide="share-2" class="w-3 h-3"></i> Share</button>
                    <div class="border-t border-gray-50 my-1"></div>
                    <button class="action-delete w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-md"><i data-lucide="trash-2" class="w-3 h-3"></i> Delete</button>
                </div>
            </div>
        `;
        historyItem.addEventListener('click', (e) => { if (!e.target.closest('.menu-trigger') && !e.target.closest('.history-menu')) { state.activeChatId = chat.id; renderChat(chat.id); } });
        const menuTrigger = historyItem.querySelector('.menu-trigger');
        const menu = historyItem.querySelector('.history-menu');
        menuTrigger.addEventListener('click', (e) => { e.stopPropagation(); document.querySelectorAll('.dropdown-content').forEach(m => { if (m !== menu) m.classList.remove('show'); }); menu.classList.toggle('show'); });
        historyItem.querySelector('.action-rename').addEventListener('click', (e) => { e.stopPropagation(); renameChat(chat.id); menu.classList.remove('show'); });
        historyItem.querySelector('.action-pin').addEventListener('click', (e) => { e.stopPropagation(); pinChat(chat.id); menu.classList.remove('show'); });
        historyItem.querySelector('.action-share').addEventListener('click', (e) => { e.stopPropagation(); alert("Link copied!"); menu.classList.remove('show'); });
        historyItem.querySelector('.action-delete').addEventListener('click', (e) => { e.stopPropagation(); deleteChat(chat.id); });
        historyContainer.insertBefore(historyItem, historyContainer.children[1]);
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
        const avatar = isUser ? '<div class="w-8 h-8 rounded-full avatar-gradient flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-md">JD</div>' : `<div class="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden"><img src="f_logo.jpg" alt="Think AI" class="w-full h-full object-cover"></div>`;
        const bubble = document.createElement('div');
        bubble.className = `px-5 py-3 ${isUser ? 'user-bubble text-white' : 'ai-bubble text-gray-700'} text-sm leading-relaxed`;
        msgDiv.innerHTML = avatar;
        const wrapper = document.createElement('div');
        wrapper.className = `flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : ''}`;
        wrapper.appendChild(bubble);
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
        if (state.isAIProcessing) {
            sendBtn.classList.add('opacity-50', 'cursor-not-allowed', 'scale-95');
            sendBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>';
        } else {
            sendBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'scale-95');
            sendBtn.innerHTML = '<i data-lucide="arrow-up" class="w-5 h-5"></i>';
        }
        lucide.createIcons();
    };

    const API_KEY = 'AIzaSyCxJtD_DeXGRw3guOQg0MjxRIFIFA8itis'; // User's Gemini API Key

    const handleSend = async () => {
        if (state.isAIProcessing) return;
        const text = chatInput.value.trim();
        if (text) {
            if (!state.activeChatId) startNewChat();
            const currentChat = state.chats.find(c => c.id === state.activeChatId);
            appendMessageToUI(text, true);
            chatInput.value = '';
            chatInput.style.height = 'auto';

            // Show loading state
            state.isAIProcessing = true;
            updateSendButtonState();

            if (API_KEY === 'YOUR_GEMINI_API_KEY') {
                setTimeout(() => {
                    state.isAIProcessing = false;
                    updateSendButtonState();
                    appendMessageToUI("⚠️ **API Key Missing!**\nTo get real answers to anything you ask, you need to add an API key.\n\n1. Go to Google AI Studio to get a free Gemini API key.\n2. Open `script.js` in your editor.\n3. Replace `'YOUR_GEMINI_API_KEY'` on line 369 with your actual key.", false);
                    lucide.createIcons();
                }, 1000);
                return;
            }

            try {
                // Prepare conversation history for the AI
                const history = currentChat.messages.map(msg => ({
                    role: msg.isUser ? "user" : "model",
                    parts: [{ text: msg.text }]
                }));

                // Add mood context if selected
                const mood = currentChat?.mood;
                if (mood) {
                    const intensity = currentChat?.intensity || 50;
                    history[history.length - 1].parts[0].text += `\n\n(Respond to this in a ${mood} tone, with an intensity of ${intensity}/100)`;
                }

                // Call the real Google Gemini API
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: history })
                });

                const data = await response.json();
                state.isAIProcessing = false; // Reset before appending so streaming works
                
                if (data.error) {
                    updateSendButtonState();
                    appendMessageToUI(`⚠️ **API Error:** ${data.error.message}`, false);
                } else if (data.candidates && data.candidates.length > 0) {
                    const aiText = data.candidates[0].content.parts[0].text;
                    appendMessageToUI(aiText, false);
                } else {
                    updateSendButtonState();
                    appendMessageToUI("Sorry, I received an invalid response from the AI.", false);
                }
            } catch (error) {
                state.isAIProcessing = false;
                updateSendButtonState();
                appendMessageToUI("Error connecting to the AI. Please check your internet connection and API key.", false);
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

    // Restore history on load
    const validChats = state.chats.filter(c => c.messages && c.messages.length > 0);
    if (validChats.length > 0) {
        validChats.forEach(chat => {
            chat.isAddedToHistory = true;
            addToHistoryUI(chat);
            if (chat.isPinned) {
                const item = document.querySelector(`.chat-history-item[data-id="${chat.id}"]`);
                if (item) {
                    item.classList.add('pinned-item');
                    const icon = item.querySelector('i:first-child');
                    if (icon) { icon.setAttribute('data-lucide', 'pin'); icon.classList.add('text-[#ff5bf8]'); }
                    const pinAction = item.querySelector('.action-pin');
                    if (pinAction) pinAction.innerHTML = '<i data-lucide="pin-off" class="w-3 h-3"></i> Unpin';
                }
            }
        });
        const lastChat = validChats[validChats.length - 1];
        state.activeChatId = lastChat.id;
        renderChat(lastChat.id);
        lucide.createIcons();
    } else {
        startNewChat();
    }
});
