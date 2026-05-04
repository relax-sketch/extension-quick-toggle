import {
    enableExtension,
    disableExtension,
    extension_settings,
    extensionNames,
} from '../../../extensions.js';
import { eventSource, event_types } from '../../../../script.js';

const extConfigs = [
    {
        key: 'vectors-enhanced',
        label: '聊天记录管理器',
        icon: 'fa-solid fa-message',
        color: '#339af0',
        toggleType: 'soft',
        settingsPath: 'vectors_enhanced',
        settingsKey: 'master_enabled',
        checkboxId: '#vectors_enhanced_master_enabled',
    },
    {
        key: 'LittleWhiteBox',
        label: '小白X',
        icon: 'fa-solid fa-box',
        color: '#51cf66',
        toggleType: 'soft',
        settingsPath: 'LittleWhiteBox',
        settingsKey: 'enabled',
        checkboxId: '#xiaobaix_enabled',
    },
    {
        key: 'WestWorld',
        label: 'WestWorld',
        icon: 'fa-solid fa-globe',
        color: '#ff6b6b',
        toggleType: 'hard',
    },
];

// ---- helpers ----

function findFullName(shortName) {
    const tp = `third-party/${shortName}`;
    if (extensionNames.includes(tp)) return tp;
    if (extensionNames.includes(shortName)) return shortName;
    return null;
}

function getSettings(cfg) {
    return extension_settings[cfg.settingsPath];
}

// ---- state reading ----

function isSoftEnabled(cfg) {
    const $cb = $(cfg.checkboxId);
    if ($cb.length) return $cb.prop('checked');
    const s = getSettings(cfg);
    if (!s) return false;
    return s[cfg.settingsKey] !== false;
}

function isHardEnabled(cfg) {
    const disabled = extension_settings.disabledExtensions || [];
    return !disabled.includes(cfg._fullName);
}

function isEnabled(cfg) {
    return cfg.toggleType === 'hard' ? isHardEnabled(cfg) : isSoftEnabled(cfg);
}

// ---- toggle logic ----

function softToggle(cfg) {
    const $cb = $(cfg.checkboxId);
    if (!$cb.length) {
        if (typeof toastr !== 'undefined') {
            toastr.warning(`无法切换 ${cfg.label}，请先进入扩展设置面板让开关加载`);
        }
        return false;
    }
    const isChecked = $cb.prop('checked');
    $cb.prop('checked', !isChecked).trigger('change');
    return true;
}

async function hardToggle(cfg) {
    const on = isHardEnabled(cfg);
    if (on) {
        await disableExtension(cfg._fullName);
    } else {
        await enableExtension(cfg._fullName);
    }
    return true;
}

function toggleEnabled(cfg) {
    return cfg.toggleType === 'hard' ? hardToggle(cfg) : softToggle(cfg);
}

// ---- UI ----

function createToggleUI() {
    const matched = [];
    for (const cfg of extConfigs) {
        if (cfg.toggleType === 'hard') {
            cfg._fullName = findFullName(cfg.key);
            if (cfg._fullName) {
                matched.push(cfg);
            } else {
                console.warn(`[ext-quick-toggle] "${cfg.key}" 未安装，按钮不显示`);
            }
        } else {
            if (getSettings(cfg)) {
                matched.push(cfg);
            } else {
                console.warn(`[ext-quick-toggle] "${cfg.key}" 未安装，按钮不显示`);
            }
        }
    }
    if (matched.length === 0) return;

    $('#ext_qt_ve, #ext_qt_lwb, #ext_qt_ww').remove();

    const $targetHr = $('.options-content').find('hr').last();

    const btnIdMap = { 'vectors-enhanced': 'ext_qt_ve', 'LittleWhiteBox': 'ext_qt_lwb', 'WestWorld': 'ext_qt_ww' };

    for (const cfg of matched) {
        const btnId = btnIdMap[cfg.key];
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
                const ok = await toggleEnabled(cfg);
                if (cfg.toggleType === 'hard') {
                    // hard toggle triggers page reload via enableExtension/disableExtension
                    return;
                }
                if (ok) {
                    refreshLabel();
                    const nowOn = isEnabled(cfg);
                    if (typeof toastr !== 'undefined') {
                        toastr.success(`${cfg.label} 已${nowOn ? '启用' : '关闭'}`);
                    }
                }
            } catch (e) {
                console.error(`[ext-quick-toggle] 切换 ${cfg.label} 失败:`, e);
                if (typeof toastr !== 'undefined') toastr.error('切换 ' + cfg.label + ' 失败');
            }
        });
    }
}

// ---- init ----

let done = false;
function tryInit() {
    if (done) return;
    if (extensionNames.length === 0) return;
    done = true;
    jQuery(createToggleUI);
}
tryInit();
eventSource.on(event_types.EXTENSION_SETTINGS_LOADED, tryInit);
