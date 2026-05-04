import { extension_settings, extensionNames } from '../../../extensions.js';
import { eventSource, event_types } from '../../../../script.js';

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

/** Read current state. Prefers the DOM checkbox (authoritative runtime state). */
function isEnabled(cfg) {
    const $cb = $(cfg.checkboxId);
    if ($cb.length) return $cb.prop('checked');
    const s = getSettings(cfg);
    if (!s) return false;
    return s[cfg.settingsKey] !== false;
}

/**
 * Toggle the internal master switch.
 *
 * IMPORTANT: We only operate the checkbox DOM element and trigger 'change'.
 * We do NOT pre-set extension_settings values — that would break the
 * extension's own change handler logic (esp. LittleWhiteBox's wasEnabled check).
 * The change handler is responsible for updating settings, toggling features,
 * and calling saveSettingsDebounced.
 */
function toggleEnabled(cfg) {
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

function createToggleUI() {
    const matched = [];
    for (const cfg of extConfigs) {
        if (getSettings(cfg)) {
            matched.push(cfg);
        } else {
            console.warn(`[ext-quick-toggle] "${cfg.key}" 未安装，按钮不显示`);
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

        $btn.on('click', () => {
            try {
                if (toggleEnabled(cfg)) {
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

// Init when extensions are loaded
let done = false;
function tryInit() {
    if (done) return;
    if (extensionNames.length === 0) return;
    done = true;
    jQuery(createToggleUI);
}
tryInit();
eventSource.on(event_types.EXTENSION_SETTINGS_LOADED, tryInit);
