import { extension_settings, extensionNames } from '../../../extensions.js';
import { saveSettingsDebounced, eventSource, event_types } from '../../../../script.js';

const extConfigs = [
    {
        key: 'vectors-enhanced',
        label: '聊天记录管理器',
        icon: 'fa-solid fa-message',
        color: '#339af0',
        settingsPath: 'vectors_enhanced',
        settingsKey: 'master_enabled',
        checkboxId: '#vectors_enhanced_master_enabled',
    },
    {
        key: 'LittleWhiteBox',
        label: '小白X',
        icon: 'fa-solid fa-box',
        color: '#51cf66',
        settingsPath: 'LittleWhiteBox',
        settingsKey: 'enabled',
        checkboxId: '#xiaobaix_enabled',
    },
];

function getSettings(cfg) {
    return extension_settings[cfg.settingsPath];
}

function isEnabled(cfg) {
    const s = getSettings(cfg);
    if (!s) return false;
    return s[cfg.settingsKey] !== false;
}

function toggleEnabled(cfg) {
    const s = getSettings(cfg);
    if (!s) return;

    const current = isEnabled(cfg);
    const next = !current;

    // Set the value directly
    s[cfg.settingsKey] = next;

    // If the extension's own settings checkbox exists in DOM,
    // update it and trigger change so its internal handler runs
    const $cb = $(cfg.checkboxId);
    if ($cb.length) {
        $cb.prop('checked', next).trigger('change');
    } else if (cfg.key === 'LittleWhiteBox') {
        // LittleWhiteBox checks this global at runtime
        window.isXiaobaixEnabled = next;
    }

    saveSettingsDebounced();
}

function createToggleUI() {
    // Check which extensions are present
    const matched = [];
    for (const cfg of extConfigs) {
        if (getSettings(cfg)) {
            matched.push(cfg);
        } else {
            console.warn(`[ext-quick-toggle] 未找到扩展 "${cfg.key}"，对应按钮不显示`);
        }
    }
    if (matched.length === 0) return;

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
            const on = isEnabled(cfg);
            $text.text(`${cfg.label}: ${on ? '已启用' : '已关闭'}`);
            $icon.css('color', on ? cfg.color : '#888');
        };
        refreshLabel();

        $btn.on('click', async () => {
            try {
                toggleEnabled(cfg);
                refreshLabel();
                if (typeof toastr !== 'undefined') {
                    const nowOn = isEnabled(cfg);
                    toastr.success(`${cfg.label} 已${nowOn ? '启用' : '关闭'}`);
                }
            } catch (e) {
                console.error(`[ext-quick-toggle] 切换 ${cfg.label} 失败:`, e);
                if (typeof toastr !== 'undefined') toastr.error('切换 ' + cfg.label + ' 失败');
            }
        });
    }
}

// Init
let done = false;
function tryInit() {
    if (done) return;
    if (extensionNames.length === 0) return;
    done = true;
    jQuery(createToggleUI);
}
tryInit();
eventSource.on(event_types.EXTENSION_SETTINGS_LOADED, tryInit);
