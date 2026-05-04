import {
    enableExtension,
    disableExtension,
    extension_settings,
    extensionNames,
} from '../../../extensions.js';
import { eventSource, event_types } from '../../../../script.js';

const extConfigs = [
    { key: 'vectors-enhanced', label: '聊天记录管理器', icon: 'fa-solid fa-message', color: '#339af0' },
    { key: 'LittleWhiteBox',    label: '小白X',        icon: 'fa-solid fa-box',     color: '#51cf66' },
];

function findFullName(shortName) {
    const tp = `third-party/${shortName}`;
    if (extensionNames.includes(tp)) return tp;
    if (extensionNames.includes(shortName)) return shortName;
    return null;
}

function isExtensionEnabled(fullName) {
    if (!fullName) return false;
    return !extension_settings.disabledExtensions.includes(fullName);
}

function createToggleUI() {
    const matched = [];
    for (const cfg of extConfigs) {
        const full = findFullName(cfg.key);
        if (full) {
            cfg._fullName = full;
            matched.push(cfg);
        } else {
            console.warn(`[ext-quick-toggle] 未找到扩展 "${cfg.key}"`);
        }
    }
    if (matched.length === 0) return;

    // Clean up previous buttons
    $('#ext_qt_ve, #ext_qt_lwb').remove();

    const $targetHr = $('.options-content').find('hr').last();

    for (const cfg of matched) {
        const btnId = cfg.key === 'vectors-enhanced' ? 'ext_qt_ve' : 'ext_qt_lwb';
        const $icon = $('<i>', { class: 'fa-lg ' + cfg.icon, css: { paddingRight: '12px' } });
        const $text = $('<span>');
        const $btn = $('<a>', { id: btnId, class: 'interactable', tabindex: 0 })
            .append($icon)
            .append($text);

        $btn.insertBefore($targetHr);

        const refreshLabel = () => {
            const on = isExtensionEnabled(cfg._fullName);
            $text.text(cfg.label + ': ' + (on ? '已启用' : '已关闭'));
            $icon.css('color', on ? cfg.color : '#888');
        };
        refreshLabel();

        $btn.on('click', async () => {
            const on = isExtensionEnabled(cfg._fullName);
            try {
                if (on) {
                    await disableExtension(cfg._fullName);
                } else {
                    await enableExtension(cfg._fullName);
                }
            } catch (e) {
                console.error(`[ext-quick-toggle] 切换 ${cfg.label} 失败:`, e);
                if (typeof toastr !== 'undefined') toastr.error('切换 ' + cfg.label + ' 失败');
            }
        });
    }
}

// Init when extension list is available
let done = false;
function tryInit() {
    if (done) return;
    if (extensionNames.length === 0) return;
    done = true;
    jQuery(createToggleUI);
}
tryInit();
eventSource.on(event_types.EXTENSION_SETTINGS_LOADED, tryInit);
