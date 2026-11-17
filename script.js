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

    // Top sidebar circle: the user's photo if set, otherwise the logo for the current theme
    const refreshSidebarLogo = () => {
        const img = document.getElementById('sidebar-logo-img');
        if (!img) return;
        const photo = localStorage.getItem('user_photo');
        const body = document.body.classList;
        const themed = body.contains('chrome-mode') ? 'logo_chrome.png' : body.contains('neon-mode') ? 'logo_neon.png' : body.contains('dark-mode') ? 'logo_dark.jpg' : 'logo.png';
        img.src = photo || themed;
    };

    const updateSidebarProfile = () => {
        const name = localStorage.getItem('user_name') || 'User';
        const photo = localStorage.getItem('user_photo');
        
        if (userDisplayName) userDisplayName.textContent = name;

        refreshSidebarLogo();

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
        activeModel: 'Fluid 2.0',
        isWebSearchEnabled: false,
        isVoiceInputActive: false,
        activeChatId: null,
        chats: savedChats,
        currentTheme: (() => { try { return localStorage.getItem('think_ai_theme') || 'light'; } catch (e) { return 'light'; } })(),
        isAIProcessing: false,
        activeMood: null,
        moodIntensities: {
            Friendly: 50, Angry: 50, Emotional: 50, Romantic: 50,
            Funny: 50, Serious: 50, Sad: 50, Happy: 50
        }
    };

    const saveChats = () => {
        try {
            // Keys starting with "_" (raw attachment data) are kept in memory only
            localStorage.setItem('think_ai_chats', JSON.stringify(state.chats, (k, v) => (k.startsWith('_') ? undefined : v)));
        } catch (e) {
            console.warn('Could not save chats (storage full?)', e);
        }
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
    // Theme cycle: Light -> Dark -> Neon -> Chrome -> Light
    const THEME_CONFIG = {
        light:  { icon: 'sun',  text: 'Light Mode',  track: '#e5e7eb', left: '2px',  logo: 'logo.png' },
        dark:   { icon: 'moon', text: 'Dark Mode',   track: '#1f2937', left: '10px', logo: 'logo_dark.jpg' },
        neon:   { icon: 'zap',  text: 'Neon Mode',   track: '#ff5bf8', left: '18px', logo: 'logo_neon.png' },
        chrome: { icon: 'gem',  text: 'Chrome Mode', track: '#9aa4b2', left: '18px', logo: 'logo_chrome.png' }
    };
    const THEME_ORDER = ['light', 'dark', 'neon', 'chrome'];

    const applyTheme = (name) => {
        if (!THEME_CONFIG[name]) name = 'light';
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        const toggleTrack = document.getElementById('toggle-track');
        const toggleThumb = document.getElementById('toggle-thumb');
        const cfg = THEME_CONFIG[name];
        state.currentTheme = name;

        document.body.classList.remove('dark-mode', 'neon-mode', 'chrome-mode');
        // Chrome builds on the dark styles and adds its own look on top
        if (name === 'dark' || name === 'chrome') document.body.classList.add('dark-mode');
        if (name === 'neon') document.body.classList.add('neon-mode');
        if (name === 'chrome') document.body.classList.add('chrome-mode');

        themeIcon.setAttribute('data-lucide', cfg.icon);
        themeText.textContent = cfg.text;
        toggleTrack.style.backgroundColor = cfg.track;
        toggleThumb.style.left = cfg.left;
        if (mainLogo) mainLogo.src = cfg.logo;
        try { localStorage.setItem('think_ai_theme', name); } catch (e) { /* not critical */ }
        lucide.createIcons();
        refreshSidebarLogo();
    };

    const toggleTheme = () => {
        const next = THEME_ORDER[(THEME_ORDER.indexOf(state.currentTheme) + 1) % THEME_ORDER.length];
        applyTheme(next);
    };

    themeToggleBtn?.addEventListener('click', (e) => { e.stopPropagation(); toggleTheme(); });

    // ---------- Settings (saved on this device) ----------
    const SETTINGS_KEY = 'comet_settings';
    const defaultSettings = { nickname: '', about: '', memory: false, globalMood: null };
    let settings = { ...defaultSettings };
    try { settings = { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch (e) { /* keep defaults */ }
    const saveSettings = () => {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { console.warn('Could not save settings', e); }
    };

    // Mood Modifier Logic
    const MOOD_EMOJI = { Friendly: '😊', Angry: '😠', Emotional: '🥺', Romantic: '💝', Funny: '😂', Serious: '🧐', Sad: '😢', Happy: '🌟' };
    const MOOD_GUIDE = {
        Friendly: 'warm, approachable and encouraging, like a good friend. Casual, natural phrasing and contractions; genuinely interested in the person.',
        Angry: 'irritated, impatient and blunt, with short punchy sentences and grumbling frustration at the situation. IMPORTANT: never insult, demean or abuse the user, no slurs and no profanity. The anger is theatrical tone only, and the answer must still be complete and helpful.',
        Emotional: 'deeply empathetic, heartfelt and expressive. Acknowledge and validate feelings, use sentimental, soft and caring language.',
        Romantic: 'affectionate, tender, charming and a little poetic, with sweet wholesome endearments. Keep it tasteful and PG; never explicit.',
        Funny: 'witty and playful: jokes, puns, light sarcasm and comic timing. The humor must never replace or distort the actual answer.',
        Serious: 'formal, precise, concise and analytical. No jokes, no slang, no emojis. Professional and to the point.',
        Sad: 'melancholic, subdued and wistful, with a gentle, slower rhythm and a soft pessimistic colour. Still helpful. If the user seems to be in real distress, drop the act and respond with genuine care instead.',
        Happy: 'upbeat, enthusiastic, optimistic and energetic. Celebrate things, positive framing, lively wording.'
    };
    const intensityWord = (v) => v <= 0 ? 'Off' : v <= 25 ? 'Subtle' : v <= 50 ? 'Mild' : v <= 75 ? 'Strong' : 'Maximum';

    // Turns the chat's saved mood + intensity into a system instruction for the AI
    const buildMemoryText = () => {
        if (!settings.memory) return '';
        const nick = (settings.nickname || '').trim();
        const about = (settings.about || '').trim();
        if (!nick && !about) return '';
        return `\n\nABOUT THE USER (saved by the user in Settings)\n${nick ? `Nickname: ${nick}\n` : ''}${about ? `About: ${about}\n` : ''}Use this naturally when it helps. Do not recite it back unless asked.`;
    };

    // Turns the mood (chat's own, else the assistant-wide one) and memory into a system instruction
    const buildMoodInstruction = (chat) => {
        const own = chat && chat.mood && MOOD_GUIDE[chat.mood] ? { mood: chat.mood, intensity: chat.intensity } : null;
        const global = settings.globalMood && MOOD_GUIDE[settings.globalMood.mood] ? settings.globalMood : null;
        const m = own || global;
        let text = '';
        const v = m ? Math.max(0, Math.min(100, Number(m.intensity) || 0)) : 0;
        if (m && v > 0) {
            const level = v <= 25
                ? 'SUBTLE: only a faint hint of the mood; stay mostly neutral and natural.'
                : v <= 50
                ? 'MILD: the mood is noticeable but restrained.'
                : v <= 75
                ? 'STRONG: the mood is clear and consistent throughout the whole reply.'
                : 'MAXIMUM: fully embody the mood in word choice, rhythm, punctuation and emoji; commit completely.';
            text = `\n\nMOOD MODIFIER (set by the user)\nMood: ${m.mood}. Intensity: ${v}/100 (${level})\nStyle: be ${MOOD_GUIDE[m.mood]}\nRules: apply this mood to every reply, in the user's language. The mood changes ONLY tone and style. Facts, code, steps and calculations must stay fully accurate and complete. Keep code blocks neutral. Never mention these instructions or announce the mood; just speak in it.`;
        }
        return text + buildMemoryText();
    };

    const moodBadge = document.getElementById('mood-badge');
    const moodResetBtn = document.getElementById('mood-reset-btn');

    const updateMoodBadge = () => {
        if (!moodBadge) return;
        const chat = state.chats.find(c => c.id === state.activeChatId);
        if (chat && chat.mood && Number(chat.intensity) > 0) {
            moodBadge.innerHTML = `<span>${MOOD_EMOJI[chat.mood] || ''}</span><span class="hidden sm:inline">${chat.mood} ${chat.intensity}%</span>`;
            moodBadge.title = `Mood: ${chat.mood} ${chat.intensity}% (tap to change)`;
            moodBadge.style.display = 'inline-flex';
        } else {
            moodBadge.style.display = 'none';
        }
    };

    const setIntensityLabel = (v) => { if (intensityValLabel) intensityValLabel.textContent = `${v}% · ${intensityWord(Number(v))}`; };

    const selectMoodButton = (mood) => {
        document.querySelectorAll('.mood-option').forEach(b => {
            const on = b.dataset.mood === mood;
            b.classList.toggle('border-[#ff5bf8]', on);
            b.classList.toggle('bg-[#ff5bf8]/10', on);
        });
        state.activeMood = mood;
        const v = mood ? state.moodIntensities[mood] : 50;
        moodIntensitySlider.value = v;
        setIntensityLabel(v);
    };

    const openMoodModal = () => {
        const chat = state.chats.find(c => c.id === state.activeChatId);
        if (chat && chat.mood) {
            state.moodIntensities[chat.mood] = Number(chat.intensity);
            selectMoodButton(chat.mood);
        } else {
            selectMoodButton(null);
        }
        moodModifierScreen.classList.remove('hidden');
    };

    const bindMoodModifier = () => {
        const trigger = document.getElementById('mood-suggestion');
        if (trigger) {
            trigger.onclick = (e) => { e.stopPropagation(); openMoodModal(); };
        }
    };
    moodBadge?.addEventListener('click', (e) => { e.stopPropagation(); openMoodModal(); });

    moodBackBtn?.addEventListener('click', () => {
        moodModifierScreen.classList.add('hidden');
    });

    moodIntensitySlider?.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        if (state.activeMood) state.moodIntensities[state.activeMood] = val;
        setIntensityLabel(val);
    });

    document.querySelectorAll('.mood-option').forEach(btn => {
        btn.addEventListener('click', () => selectMoodButton(btn.dataset.mood));
    });

    const syncMoodCard = () => {
        const chat = state.chats.find(c => c.id === state.activeChatId);
        const trigger = document.getElementById('mood-suggestion');
        if (!trigger) return;
        const p = trigger.querySelector('p');
        if (chat && chat.hasModifiedMood && chat.mood) {
            if (p) p.textContent = `Active Mood: ${chat.mood} (${chat.intensity}%). Tap to change.`;
        } else if (p) {
            p.textContent = 'Customize how I respond to you.';
        }
        trigger.classList.remove('opacity-50', 'pointer-events-none');
    };

    moodConfirmBtn?.addEventListener('click', () => {
        if (!state.activeMood) { alert("Please select a mood first!"); return; }
        const chat = state.chats.find(c => c.id === state.activeChatId);
        if (chat) {
            chat.mood = state.activeMood;
            chat.intensity = Number(state.moodIntensities[state.activeMood]);
            chat.hasModifiedMood = true;
        }
        saveChats();
        moodModifierScreen.classList.add('hidden');
        syncMoodCard();
        updateMoodBadge();
    });

    moodResetBtn?.addEventListener('click', () => {
        const chat = state.chats.find(c => c.id === state.activeChatId);
        if (chat) { chat.mood = null; chat.intensity = 50; chat.hasModifiedMood = false; }
        saveChats();
        selectMoodButton(null);
        moodModifierScreen.classList.add('hidden');
        syncMoodCard();
        updateMoodBadge();
    });

    // Model Logic
    const updateModelSelection = (selectedOption) => {
        const model = selectedOption.dataset.model;
        state.activeModel = model;
        // Each box shows only what was picked in that box
        const fromInputBox = !!selectedOption.closest('#input-model-dropdown');
        const label = fromInputBox
            ? document.getElementById('input-model-label')
            : document.querySelector('#model-selector span');
        if (label) label.textContent = model;
        const ownMenu = selectedOption.closest('.dropdown-content');
        ownMenu?.querySelectorAll('.check-icon').forEach(icon => icon.remove());
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
        if (fromInputBox) document.getElementById('input-model-dropdown')?.classList.remove('show');
    };

    document.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', (e) => { e.stopPropagation(); updateModelSelection(option); });
    });

    // Model picker next to the + button (opens upward)
    const inputModelBtn = document.getElementById('input-model-btn');
    const inputModelDropdown = document.getElementById('input-model-dropdown');
    inputModelBtn?.addEventListener('click', (e) => { e.stopPropagation(); inputModelDropdown.classList.toggle('show'); });

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
            const prev = state.previousModel || 'Fluid 2.0';
            // Top box goes back to Think-Chat; bottom box returns to the model used before
            const thinkOption = document.querySelector('#model-dropdown .model-option[data-model="Think-Chat"]');
            if (thinkOption) updateModelSelection(thinkOption);
            const option = document.querySelector(`.model-option[data-model="${prev}"]`);
            if (option) updateModelSelection(option);
        }
    });

    // ---------- Attachments (+ menu): photos, videos, camera, files ----------
    const pendingAttachments = [];
    const MAX_FILE_BYTES = 12 * 1024 * 1024;
    const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
    const TEXT_EXT = /\.(txt|md|csv|tsv|json|xml|html?|css|js|jsx|ts|tsx|py|java|c|cpp|h|cs|go|rs|php|rb|sh|sql|yml|yaml|log|ini|toml|swift|kt)$/i;
    const attachmentTray = document.getElementById('attachment-tray');

    const showToast = (msg) => {
        const t = document.createElement('div');
        t.textContent = msg;
        t.className = 'fixed left-1/2 bottom-28 -translate-x-1/2 z-[200] px-4 py-2 rounded-xl bg-black/85 text-white text-xs shadow-xl max-w-[90vw] text-center';
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    };

    const readAsDataURL = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
    const readAsText = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(f); });
    const makeThumb = (dataUrl, max = 480) => new Promise((res) => {
        const img = new Image();
        img.onload = () => {
            const sc = Math.min(1, max / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(img.width * sc));
            c.height = Math.max(1, Math.round(img.height * sc));
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => res(null);
        img.src = dataUrl;
    });

    const renderAttachmentTray = () => {
        if (!attachmentTray) return;
        attachmentTray.innerHTML = '';
        attachmentTray.classList.toggle('hidden', pendingAttachments.length === 0);
        attachmentTray.classList.toggle('flex', pendingAttachments.length > 0);
        const iconFor = { image: 'image', video: 'video', audio: 'music', file: 'file-text' };
        pendingAttachments.forEach((a, i) => {
            const item = document.createElement('div');
            item.className = 'tray-item';
            if (a.meta.kind === 'image' && a.meta.thumb) {
                const img = document.createElement('img');
                img.src = a.meta.thumb;
                img.alt = a.meta.name;
                img.className = 'tray-thumb';
                item.appendChild(img);
            } else {
                const ic = document.createElement('i');
                ic.setAttribute('data-lucide', iconFor[a.meta.kind] || 'file');
                ic.className = 'w-4 h-4 text-[#ff5bf8] shrink-0';
                const nm = document.createElement('span');
                nm.className = 'truncate max-w-[140px]';
                nm.textContent = a.meta.name;
                item.append(ic, nm);
            }
            const rm = document.createElement('button');
            rm.className = 'tray-remove';
            rm.title = 'Remove';
            rm.innerHTML = '&times;';
            rm.addEventListener('click', (e) => { e.stopPropagation(); pendingAttachments.splice(i, 1); renderAttachmentTray(); });
            item.appendChild(rm);
            attachmentTray.appendChild(item);
        });
        lucide.createIcons();
    };

    const addFiles = async (fileList) => {
        for (const file of fileList) {
            const total = pendingAttachments.reduce((sum, a) => sum + a.size, 0);
            if (file.size > MAX_FILE_BYTES) { showToast(`"${file.name}" is too large (max 12 MB per file).`); continue; }
            if (total + file.size > MAX_TOTAL_BYTES) { showToast('Attachments are too large together (max 15 MB per message).'); continue; }
            const type = file.type || '';
            const isText = type.startsWith('text/') || type === 'application/json' || TEXT_EXT.test(file.name);
            let kind, part, thumb = null;
            try {
                if (isText) {
                    kind = 'file';
                    let t = await readAsText(file);
                    if (t.length > 200000) t = t.slice(0, 200000) + '\n...[truncated]';
                    part = { text: `[Attached file: ${file.name}]\n${t}` };
                } else if (/^(image|video|audio)\//.test(type) || type === 'application/pdf') {
                    const dataUrl = await readAsDataURL(file);
                    kind = type.startsWith('image/') ? 'image' : type.startsWith('video/') ? 'video' : type.startsWith('audio/') ? 'audio' : 'file';
                    if (kind === 'image') thumb = await makeThumb(dataUrl);
                    part = { inlineData: { mimeType: type, data: dataUrl.split(',')[1] } };
                } else {
                    showToast(`"${file.name}" can't be read by the AI. Try a photo, video, audio, PDF or text file.`);
                    continue;
                }
            } catch (err) {
                console.error('Failed to read file', err);
                showToast(`Could not read "${file.name}".`);
                continue;
            }
            pendingAttachments.push({ size: file.size, part, meta: { name: file.name, type, size: file.size, kind, thumb } });
        }
        renderAttachmentTray();
    };

    const makeFileInput = (accept, capture) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.className = 'hidden';
        if (accept) input.accept = accept;
        if (capture) input.setAttribute('capture', 'environment'); else input.multiple = true;
        input.addEventListener('change', () => { addFiles(Array.from(input.files)); input.value = ''; });
        document.body.appendChild(input);
        return input;
    };
    const attachPhotoInput = makeFileInput('image/*');
    const videoInput = makeFileInput('video/*');
    const cameraInput = makeFileInput('image/*', true);
    const anyFileInput = makeFileInput('');
    document.getElementById('upload-photo-btn')?.addEventListener('click', () => attachPhotoInput.click());
    document.getElementById('upload-video-btn')?.addEventListener('click', () => videoInput.click());
    document.getElementById('upload-camera-btn')?.addEventListener('click', () => cameraInput.click());
    document.getElementById('upload-file-btn')?.addEventListener('click', () => anyFileInput.click());

    // Paste images/files straight into the box
    chatInput?.addEventListener('paste', (e) => {
        const files = Array.from(e.clipboardData?.files || []);
        if (files.length) { e.preventDefault(); addFiles(files); }
    });

    // ---------- Settings screen ----------
    const settingsScreen = document.getElementById('settings-screen');
    const settingsAbout = document.getElementById('settings-about');
    const logoutModal = document.getElementById('logout-modal');
    const avatarFileInput = document.createElement('input');
    avatarFileInput.type = 'file';
    avatarFileInput.accept = 'image/*';
    avatarFileInput.className = 'hidden';
    document.body.appendChild(avatarFileInput);

    const currentUserName = () => localStorage.getItem('user_name') || 'User';
    const headerModelName = () => document.querySelector('#model-selector span')?.textContent || 'Think-Chat';
    const inputModelName = () => document.getElementById('input-model-label')?.textContent || 'Fluid 2.0';

    const refreshSettingsUI = () => {
        const name = currentUserName();
        const photo = localStorage.getItem('user_photo');
        const img = document.getElementById('settings-avatar-img');
        const initial = document.getElementById('settings-avatar-initial');
        if (photo && img) { img.src = photo; img.classList.remove('hidden'); initial?.classList.add('hidden'); }
        else { img?.classList.add('hidden'); if (initial) { initial.textContent = name.charAt(0).toUpperCase(); initial.classList.remove('hidden'); } }
        document.getElementById('settings-name').textContent = name;

        const gm = settings.globalMood;
        document.getElementById('settings-mood-value').textContent = gm ? `${MOOD_EMOJI[gm.mood] || ''} ${gm.mood} ${gm.intensity}%` : 'Off';
        document.querySelectorAll('.settings-mood').forEach(b => {
            const on = !!gm && b.dataset.mood === gm.mood;
            b.classList.toggle('border-[#ff5bf8]', on);
            b.classList.toggle('bg-[#ff5bf8]/10', on);
        });
        const v = gm ? Number(gm.intensity) : 50;
        document.getElementById('settings-mood-slider').value = v;
        document.getElementById('settings-mood-intensity-label').textContent = `${v}%`;

        const memBtn = document.getElementById('settings-memory-toggle');
        memBtn.textContent = settings.memory ? 'On' : 'Off';
        memBtn.classList.toggle('bg-[#ff5bf8]', !!settings.memory);
        memBtn.classList.toggle('text-white', !!settings.memory);
        document.getElementById('settings-memory-value').textContent = settings.memory ? 'On' : 'Off';
        document.getElementById('settings-nickname').value = settings.nickname || '';
        document.getElementById('settings-about-you').value = settings.about || '';

        const hm = headerModelName(), im = inputModelName();
        document.getElementById('settings-mode-value').textContent = hm;
        document.getElementById('settings-model-value').textContent = im;
        document.querySelectorAll('[data-setting-mode]').forEach(b => b.classList.toggle('bg-[#ff5bf8]/10', b.dataset.settingMode === hm));
        document.querySelectorAll('[data-setting-model]').forEach(b => b.classList.toggle('bg-[#ff5bf8]/10', b.dataset.settingModel === im));

        const webBtn = document.getElementById('settings-web-toggle');
        webBtn.textContent = state.isWebSearchEnabled ? 'On' : 'Off';
        webBtn.classList.toggle('bg-[#ff5bf8]', !!state.isWebSearchEnabled);
        webBtn.classList.toggle('text-white', !!state.isWebSearchEnabled);
        lucide.createIcons();
    };

    const applySettingsSearch = (q) => {
        q = q.trim().toLowerCase();
        document.querySelectorAll('.settings-group').forEach(group => {
            let visible = 0;
            group.querySelectorAll('.settings-row').forEach(row => {
                const text = ((row.dataset.search || '') + ' ' + row.textContent).toLowerCase();
                const show = !q || text.includes(q);
                row.classList.toggle('hidden', !show);
                if (show) visible++;
            });
            group.classList.toggle('hidden', visible === 0);
        });
        [settingsAbout, document.getElementById('settings-logout')].forEach(el => {
            if (!el) return;
            const show = !q || ((el.dataset.search || '') + ' ' + el.textContent).toLowerCase().includes(q);
            el.classList.toggle('hidden', !show);
        });
    };

    const openSettings = () => {
        settingsAbout.textContent = 'About';
        aboutTaps = 0;
        document.getElementById('settings-about-note')?.classList.add('hidden');
        const search = document.getElementById('settings-search');
        if (search) search.value = '';
        applySettingsSearch('');
        refreshSettingsUI();
        settingsScreen.classList.remove('hidden');
    };
    const closeSettings = () => settingsScreen.classList.add('hidden');

    // Pick a Think or Core/Fluid model from the settings screen, using the same logic as the pickers
    const pickModelFromSettings = (name) => {
        const opt = document.querySelector(`.model-option[data-model="${name}"]`);
        if (opt) updateModelSelection(opt);
        refreshSettingsUI();
    };

    document.getElementById('open-settings-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('settings-dropdown')?.classList.remove('show');
        openSettings();
    });
    document.getElementById('settings-back')?.addEventListener('click', closeSettings);

    document.querySelectorAll('.settings-row-head').forEach(btn => {
        btn.addEventListener('click', () => btn.parentElement.querySelector('.settings-row-body')?.classList.toggle('hidden'));
    });

    // Mood modifier: applies to all chats unless a chat sets its own
    document.querySelectorAll('.settings-mood').forEach(btn => {
        btn.addEventListener('click', () => {
            const v = Number(document.getElementById('settings-mood-slider').value) || 50;
            settings.globalMood = { mood: btn.dataset.mood, intensity: v };
            saveSettings(); refreshSettingsUI();
        });
    });
    document.querySelector('.settings-mood-off')?.addEventListener('click', () => { settings.globalMood = null; saveSettings(); refreshSettingsUI(); });
    document.getElementById('settings-mood-slider')?.addEventListener('input', (e) => {
        const v = Number(e.target.value);
        if (settings.globalMood) settings.globalMood.intensity = v;
        document.getElementById('settings-mood-intensity-label').textContent = `${v}%`;
        saveSettings();
        if (settings.globalMood) document.getElementById('settings-mood-value').textContent = `${MOOD_EMOJI[settings.globalMood.mood] || ''} ${settings.globalMood.mood} ${v}%`;
    });

    // Memory
    document.getElementById('settings-memory-toggle')?.addEventListener('click', () => { settings.memory = !settings.memory; saveSettings(); refreshSettingsUI(); });
    document.getElementById('settings-nickname')?.addEventListener('input', (e) => { settings.nickname = e.target.value.slice(0, 40); saveSettings(); });
    document.getElementById('settings-about-you')?.addEventListener('input', (e) => { settings.about = e.target.value.slice(0, 500); saveSettings(); });

    // Mode and model
    document.querySelectorAll('[data-setting-mode]').forEach(b => b.addEventListener('click', () => pickModelFromSettings(b.dataset.settingMode)));
    document.querySelectorAll('[data-setting-model]').forEach(b => b.addEventListener('click', () => pickModelFromSettings(b.dataset.settingModel)));

    // Web search: uses the same globe logic as the chat box
    document.getElementById('settings-web-toggle')?.addEventListener('click', () => {
        document.getElementById('web-search-toggle')?.click();
        setTimeout(refreshSettingsUI, 0);
    });

    // About shows the version
    // First tap shows the version; second tap also shows the disclaimer
    let aboutTaps = 0;
    settingsAbout?.addEventListener('click', () => {
        aboutTaps++;
        settingsAbout.textContent = 'v06.01.0';
        document.getElementById('settings-about-note')?.classList.toggle('hidden', aboutTaps < 2);
    });

    // Profile photo and name
    document.getElementById('settings-avatar-edit')?.addEventListener('click', () => avatarFileInput.click());
    avatarFileInput.addEventListener('change', async () => {
        const file = avatarFileInput.files[0];
        avatarFileInput.value = '';
        if (!file) return;
        try {
            const dataUrl = await readAsDataURL(file);
            const small = (await makeThumb(dataUrl, 256)) || dataUrl;
            localStorage.setItem('user_photo', small);
            updateSidebarProfile();
            refreshSettingsUI();
        } catch (err) {
            showToast('Could not use that photo.');
        }
    });
    document.getElementById('settings-name-edit')?.addEventListener('click', () => {
        const next = prompt('Your name', currentUserName());
        if (next && next.trim()) {
            localStorage.setItem('user_name', next.trim().slice(0, 40));
            updateSidebarProfile();
            refreshSettingsUI();
        }
    });

    // Log out with confirmation
    document.getElementById('settings-logout')?.addEventListener('click', () => logoutModal.classList.remove('hidden'));
    document.getElementById('logout-cancel')?.addEventListener('click', () => logoutModal.classList.add('hidden'));
    document.getElementById('logout-confirm')?.addEventListener('click', () => {
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_photo');
        logoutModal.classList.add('hidden');
        closeSettings();
        if (setupNameInput) setupNameInput.value = '';
        updateSidebarProfile();
        profileOverlay?.classList.remove('hidden');
    });

    document.getElementById('settings-search')?.addEventListener('input', (e) => applySettingsSearch(e.target.value));

    // ---------- Offline handling ----------
    const offlineBanner = document.getElementById('offline-banner');
    const offlineScreen = document.getElementById('offline-screen');
    const offlineStatus = document.getElementById('offline-status');
    let offlineDismissed = false;

    const showOfflineScreen = () => {
        if (!offlineScreen) return;
        const logo = document.getElementById('offline-logo');
        if (logo) logo.src = (THEME_CONFIG[state.currentTheme] || THEME_CONFIG.light).logo;
        offlineScreen.classList.remove('hidden');
        lucide.createIcons();
    };
    const hideOfflineScreen = () => offlineScreen?.classList.add('hidden');

    const updateOnlineStatus = () => {
        if (navigator.onLine) {
            offlineDismissed = false;
            if (offlineBanner) offlineBanner.style.display = 'none';
            hideOfflineScreen();
        } else {
            if (offlineBanner) offlineBanner.style.display = 'flex';
            if (!offlineDismissed) showOfflineScreen();
            lucide.createIcons();
        }
    };

    window.addEventListener('online', () => { updateOnlineStatus(); showToast('Back online.'); });
    window.addEventListener('offline', updateOnlineStatus);
    document.getElementById('offline-retry')?.addEventListener('click', () => {
        if (navigator.onLine) {
            updateOnlineStatus();
        } else if (offlineStatus) {
            offlineStatus.textContent = 'Still offline. We will reconnect automatically.';
        }
    });
    document.getElementById('offline-continue')?.addEventListener('click', () => {
        offlineDismissed = true;
        hideOfflineScreen();
    });
    updateOnlineStatus();

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
            syncMoodCard();
        } else {
            initialState.style.display = 'none';
            if (moodModifierScreen) moodModifierScreen.classList.add('hidden');
            chat.messages.forEach((msg, idx) => appendMessageToUI(msg.text, msg.isUser, false, false, idx, msg.attachments));
        }
        document.querySelectorAll('.chat-history-item').forEach(item => {
            const isActive = parseInt(item.dataset.id) === chatId;
            item.classList.toggle('bg-white', isActive);
            item.classList.toggle('shadow-sm', isActive);
            item.classList.toggle('border', isActive);
            const icon = item.querySelector('i:first-child');
            if (icon) { icon.classList.toggle('text-[#ff5bf8]', isActive); icon.classList.toggle('text-gray-400', !isActive); }
        });
        updateMoodBadge();
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
            chat.titleEdited = true;
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
            <span class="flex-1 text-sm truncate text-gray-500">${escapeHTML(chat.title)}</span>
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

    // Instant placeholder title (first words of the first message) until the AI title arrives
    const quickTitle = (t) => {
        let c = (t || '').replace(/\s+/g, ' ').trim();
        if (c.length <= 32) return c || 'New Chat';
        c = c.slice(0, 32);
        const i = c.lastIndexOf(' ');
        return (i > 15 ? c.slice(0, i) : c) + '…';
    };

    const escapeHTML = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const applyChatTitle = (chatId, title) => {
        const chat = state.chats.find(c => c.id === chatId);
        if (!chat) return;
        chat.title = title;
        saveChats();
        if (state.activeChatId === chatId) {
            const headerTitle = document.getElementById('active-chat-title');
            if (headerTitle) headerTitle.textContent = title;
        }
        const itemSpan = document.querySelector(`.chat-history-item[data-id="${chatId}"] > span`);
        if (itemSpan) itemSpan.textContent = title;
    };

    // Names the chat after its first message (like ChatGPT / Claude)
    const generateChatTitle = async (firstMessageText, chatId, attempt = 1) => {
        const titlePrompt = [
            {
                role: "user",
                parts: [{ text: `Write a very short chat title (2-5 words) that describes the topic of the user's first message. Use the same language as the message. Reply with ONLY the title: no quotes, no trailing punctuation, no formatting, no introduction.\n\nFirst message:\n${String(firstMessageText).slice(0, 1000)}` }]
            }
        ];

        try {
            const result = await callGeminiAPI(titlePrompt);
            const raw = result.success && result.data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
            let title = (raw || '').split('\n')[0].replace(/^["'“”‘’`*#\s]+|["'“”‘’`*.\s]+$/g, '').trim();
            if (title) {
                if (title.length > 40) title = title.slice(0, 40).trim() + '…';
                const chat = state.chats.find(c => c.id === chatId);
                // Don't overwrite a name the user typed themselves
                if (chat && !chat.titleEdited) applyChatTitle(chatId, title);
            } else if (attempt < 2) {
                setTimeout(() => generateChatTitle(firstMessageText, chatId, attempt + 1), 3000);
            }
        } catch (error) {
            console.error("Error generating chat title:", error);
            if (attempt < 2) setTimeout(() => generateChatTitle(firstMessageText, chatId, attempt + 1), 3000);
        }
    };

    const copyMessageToClipboard = (plainText, btnElement) => {
        navigator.clipboard.writeText(plainText).then(() => {
            const icon = btnElement.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', 'check');
                icon.classList.add('text-[#ff5bf8]');
                lucide.createIcons();
                
                // Show tooltip
                const tooltip = document.createElement('span');
                tooltip.textContent = 'Copied!';
                tooltip.className = 'absolute bottom-full mb-1 text-[10px] bg-black text-white px-2 py-0.5 rounded shadow opacity-90 transition-opacity duration-200 pointer-events-none z-50';
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translateX(-50%)';
                btnElement.style.position = 'relative';
                btnElement.appendChild(tooltip);
                
                setTimeout(() => {
                    tooltip.classList.add('opacity-0');
                    setTimeout(() => {
                        tooltip.remove();
                        icon.setAttribute('data-lucide', 'copy');
                        icon.classList.remove('text-[#ff5bf8]');
                        lucide.createIcons();
                    }, 200);
                }, 1500);
            }
        }).catch(err => {
            console.error("Clipboard copy failed:", err);
        });
    };

    // Build the Gemini "contents" array, including any attached files
    const buildHistory = (messages) => messages.map(msg => {
        const parts = [];
        if (msg.isUser && msg._files && msg._files.length) {
            parts.push(...msg._files);
        } else if (msg.isUser && msg.attachments && msg.attachments.length) {
            parts.push({ text: `[User attached earlier: ${msg.attachments.map(a => a.name).join(', ')}]` });
        }
        parts.push({ text: msg.text || (msg.attachments && msg.attachments.length ? 'Please look at the attached file(s).' : ' ') });
        return { role: msg.isUser ? "user" : "model", parts };
    });

    const resubmitMessage = async (chatId, msgIndex, newText, isRegenerate = false) => {
        if (state.isAIProcessing) return;
        if (!navigator.onLine) { showToast("You're offline. Connect to the internet to resend."); renderChat(chatId); return; }
        
        const chat = state.chats.find(c => c.id === chatId);
        if (!chat) return;
        
        // Update the message text and truncate subsequent messages
        chat.messages[msgIndex].text = newText;
        chat.messages = chat.messages.slice(0, msgIndex + 1);
        
        // If it was the first message, update the chat title
        if (msgIndex === 0 && !isRegenerate) {
            if (!chat.titleEdited) {
                chat.title = quickTitle(newText);
                generateChatTitle(newText, chatId);
            }
        }
        
        saveChats();
        
        // Re-render the chat UI
        renderChat(chatId);
        
        // Trigger AI processing
        state.isAIProcessing = true;
        updateSendButtonState();
        
        try {
            const history = buildHistory(chat.messages);
            
            const result = await callGeminiAPI(history, buildMoodInstruction(chat));
            state.isAIProcessing = false;
            
            if (result.error) {
                updateSendButtonState();
                appendMessageToUI(`⚠️ **API Error:** ${result.error.message}`, false);
            } else if (result.success && result.data.candidates && result.data.candidates.length > 0) {
                const aiText = result.data.candidates[0].content.parts[0].text;
                appendMessageToUI(aiText, false, true, false);
                updateSendButtonState();
                
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
    };

    // Regenerate: ask again for the reply to the user message that came before this reply
    const regenerateResponse = (aiIndex) => {
        if (state.isAIProcessing) return;
        if (!navigator.onLine) { showToast("You're offline. Connect to the internet to regenerate."); return; }
        const chat = state.chats.find(c => c.id === state.activeChatId);
        if (!chat) return;
        let u = aiIndex - 1;
        while (u >= 0 && !chat.messages[u].isUser) u--;
        if (u < 0) return;
        resubmitMessage(chat.id, u, chat.messages[u].text, true);
    };

    const startEditingMessage = (bubbleElement, msgIndex) => {
        const chat = state.chats.find(c => c.id === state.activeChatId);
        if (!chat) return;
        
        const originalText = chat.messages[msgIndex].text;
        const originalHTML = bubbleElement.innerHTML;
        
        // Create edit interface
        bubbleElement.innerHTML = '';
        bubbleElement.className = 'px-5 py-3 user-bubble text-sm leading-relaxed w-full';
        
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-container flex items-end gap-2 w-full';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'edit-input-field flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white resize-none text-sm p-0';
        textarea.value = originalText;
        textarea.rows = 1;
        
        // Auto-resize logic for textarea
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
        
        const submitBtn = document.createElement('button');
        submitBtn.className = 'edit-submit-btn w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow transition-all hover:scale-105';
        submitBtn.setAttribute('title', 'Resubmit');
        submitBtn.innerHTML = '<i data-lucide="arrow-up" class="w-4 h-4 text-[#ff5bf8]"></i>';
        
        editContainer.appendChild(textarea);
        editContainer.appendChild(submitBtn);
        bubbleElement.appendChild(editContainer);
        
        lucide.createIcons();
        textarea.focus();
        textarea.style.height = textarea.scrollHeight + 'px';
        
        let isSubmittedOrCancelled = false;
        
        const cancelEdit = () => {
            if (isSubmittedOrCancelled) return;
            isSubmittedOrCancelled = true;
            bubbleElement.innerHTML = originalHTML;
            bubbleElement.className = 'px-5 py-3 user-bubble text-white text-sm leading-relaxed';
        };
        
        const submitEdit = () => {
            if (isSubmittedOrCancelled) return;
            const newText = textarea.value.trim();
            if (!newText) {
                cancelEdit();
                return;
            }
            isSubmittedOrCancelled = true;
            resubmitMessage(state.activeChatId, msgIndex, newText);
        };
        
        submitBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            submitEdit();
        });
        
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
        
        textarea.addEventListener('blur', () => {
            setTimeout(() => {
                if (!isSubmittedOrCancelled) {
                    cancelEdit();
                }
            }, 200);
        });
    };

    const appendMessageToUI = (text, isUser = true, saveToState = true, shouldStream = true, msgIndex = undefined, attachments = null, files = null) => {
        // Hide initial state (logo and mood modifier suggestion) as soon as messages are added
        if (initialState) initialState.style.display = 'none';

        const msgDiv = document.createElement('div');
        msgDiv.className = `flex ${isUser ? 'flex-row-reverse' : ''} gap-4 message-enter group msg-row`;
        
        const chat = state.chats.find(c => c.id === state.activeChatId);
        let index = msgIndex;
        if (index === undefined && chat) {
            index = chat.messages.length;
        }
        msgDiv.dataset.index = index;

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
            avatar = `<div class="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden"><img src="comet_avatar.png" alt="Comet" class="w-full h-full object-cover"></div>`;
        }
        
        const bubble = document.createElement('div');
        bubble.className = `px-5 py-3 ${isUser ? 'user-bubble text-white' : 'ai-bubble text-gray-700'} text-sm leading-relaxed`;
        msgDiv.innerHTML = avatar;
        
        const wrapper = document.createElement('div');
        wrapper.className = `flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : ''}`;
        wrapper.appendChild(bubble);
        
        // Add Copy and Edit actions
        // Attachments (photos, videos, files) shown above the message text
        if (attachments && attachments.length) {
            const attWrap = document.createElement('div');
            attWrap.className = `flex flex-wrap gap-2 ${isUser ? 'justify-end' : ''}`;
            const iconFor = { image: 'image', video: 'video', audio: 'music', file: 'file-text' };
            attachments.forEach(a => {
                if (a.kind === 'image' && a.thumb) {
                    const img = document.createElement('img');
                    img.src = a.thumb;
                    img.alt = a.name;
                    img.className = 'msg-attach-img';
                    attWrap.appendChild(img);
                } else {
                    const chip = document.createElement('div');
                    chip.className = 'attach-chip';
                    const ic = document.createElement('i');
                    ic.setAttribute('data-lucide', iconFor[a.kind] || 'file');
                    ic.className = 'w-4 h-4 text-[#ff5bf8] shrink-0';
                    const nm = document.createElement('span');
                    nm.className = 'truncate';
                    nm.textContent = a.name;
                    chip.append(ic, nm);
                    attWrap.appendChild(chip);
                }
            });
            wrapper.insertBefore(attWrap, bubble);
        }
        if (isUser && !text) bubble.classList.add('hidden');

        if (isUser && text) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions flex justify-end w-full';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-msg-btn';
            editBtn.setAttribute('title', 'Edit message');
            editBtn.innerHTML = '<i data-lucide="pencil" class="w-4 h-4"></i>';
            
            editBtn.addEventListener('click', () => {
                startEditingMessage(bubble, index);
            });
            
            actionsDiv.appendChild(editBtn);
            wrapper.appendChild(actionsDiv);
        } else if (!isUser) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions flex justify-start w-full';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'action-btn copy-msg-btn';
            copyBtn.setAttribute('title', 'Copy message');
            copyBtn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i>';
            
            copyBtn.addEventListener('click', () => {
                copyMessageToClipboard(text, copyBtn);
            });

            const regenBtn = document.createElement('button');
            regenBtn.className = 'action-btn regen-msg-btn';
            regenBtn.setAttribute('title', 'Regenerate response');
            regenBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4"></i>';
            regenBtn.addEventListener('click', () => regenerateResponse(index));

            actionsDiv.appendChild(copyBtn);
            actionsDiv.appendChild(regenBtn);
            wrapper.appendChild(actionsDiv);
        }
        
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
                    lucide.createIcons();
                }
            }, 10);
        } else {
            bubble.innerHTML = formatContent(text);
        }

        if (saveToState && state.activeChatId) {
            const chat = state.chats.find(c => c.id === state.activeChatId);
            if (chat) {
                const msgObj = { text, isUser };
                if (attachments && attachments.length) { msgObj.attachments = attachments; msgObj._files = files; }
                chat.messages.push(msgObj);
                if (isUser && chat.messages.length === 1) {
                    const titleText = text || (attachments && attachments[0] ? attachments[0].name : 'Attachment');
                    chat.title = quickTitle(titleText);
                    // Update the active chat title in the header
                    const headerTitle = document.getElementById('active-chat-title');
                    if (headerTitle) headerTitle.textContent = chat.title;
                    if (!chat.isAddedToHistory) { addToHistoryUI(chat); chat.isAddedToHistory = true; }
                    // Generate AI title in background
                    generateChatTitle(titleText, state.activeChatId);
                }
                saveChats();
            }
        }
        
        lucide.createIcons();
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
                registration.showNotification('Comet', {
                    body: `Your answer is ready: "${snippet}"`,
                    icon: 'logo.png',
                    badge: 'logo.png',
                    vibrate: [200, 100, 200],
                    tag: 'think-ai-answer',
                    renotify: true
                });
            });
        } else {
            new Notification('Comet', {
                body: `Your answer is ready: "${snippet}"`,
                icon: 'logo.png',
                tag: 'think-ai-answer'
            });
        }
    };

    // Chat requests go to your COMET POWER API server (comet_power_api_v2).
    // Paste the COMET_API_KEYS password from Render between the quotes below.
    const COMET_API_URL = 'https://think-ai-krri.onrender.com/v1/chat/completions';
    const COMET_PASSWORD = 'Fluid2.0';

    // Converts the app's Gemini-style history into the server's chat format and back again.
    const callGeminiAPI = async (history, moodText = '') => {
        try {
            const recent = history.slice(-30);
            const messages = [];
            const mood = (moodText || '').trim();
            if (mood) messages.push({ role: 'system', content: mood });
            recent.forEach(item => {
                const text = (item.parts || []).filter(p => p.text).map(p => p.text).join('\n').trim();
                if (!text) return;
                messages.push({ role: item.role === 'model' ? 'assistant' : 'user', content: text });
            });
            // The server expects the conversation to end with the user's message
            while (messages.length && messages[messages.length - 1].role !== 'user') messages.pop();
            if (!messages.length) return { error: { message: 'Nothing to send yet.' } };

            const response = await fetch(COMET_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + COMET_PASSWORD },
                body: JSON.stringify({ messages, max_tokens: 1024 })
            });
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Comet server returned a non-JSON response:', response.status, parseError);
                return { error: { message: 'Comet is unavailable right now. Please try again in a moment.' } };
            }
            if (!response.ok || data.error) {
                const msg = (data.error && data.error.message) || ('Request failed (' + response.status + ')');
                return { error: { message: msg } };
            }
            const text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
            return { success: true, data: { candidates: [{ content: { parts: [{ text: text || '' }] } }] } };
        } catch (error) {
            console.error('Comet API request failed:', error);
            return { error: { message: 'Could not connect to Comet. Check your internet connection and try again.' } };
        }
    };

    const handleSend = async () => {
        if (state.isVoiceInputActive) {
            stopVoiceInput();
            return;
        }
        if (state.isAIProcessing) return;
        if (!navigator.onLine) { showToast("You're offline. Connect to the internet to send messages."); return; }
        const text = chatInput.value.trim();
        if (text || pendingAttachments.length) {
            requestNotificationPermission(); // Silent request on explicit user click/send
            if (!state.activeChatId) startNewChat();
            const currentChat = state.chats.find(c => c.id === state.activeChatId);
            if (moodModifierScreen) moodModifierScreen.classList.add('hidden');
            const sent = pendingAttachments.splice(0);
            renderAttachmentTray();
            appendMessageToUI(text, true, true, true, undefined,
                sent.length ? sent.map(a => a.meta) : null,
                sent.length ? sent.map(a => a.part) : null);
            chatInput.value = '';
            chatInput.style.height = 'auto';

            state.isAIProcessing = true;
            updateSendButtonState();

            try {
                // All models now use Gemini since other keys were removed
                const history = buildHistory(currentChat.messages);
                
                const result = await callGeminiAPI(history, buildMoodInstruction(currentChat));
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

    applyTheme(state.currentTheme);

    // On open: keep saved chats in the sidebar history, but start with a fresh chat
    const validChats = state.chats.filter(c => c.messages && c.messages.length > 0);
    state.chats = validChats;
    validChats.forEach(chat => { chat.isAddedToHistory = true; });
    if (validChats.length > 0) refreshHistoryList();
    startNewChat();
});
