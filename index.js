import {
    enableExtension,
    disableExtension,
    extension_settings,
    extensionNames,
} from '../../../extensions.js';
import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';

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
        quickToggleEnabled: false,
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
        quickToggleEnabled: false,
    },
    {
        key: 'WestWorld',
        label: 'WestWorld',
        icon: 'fa-solid fa-globe',
        color: '#ff6b6b',
        toggleType: 'hard',
    },
    {
        key: 'WestWorld-director-suffix',
        label: '导演自由内容',
        icon: 'fa-solid fa-file-pen',
        color: '#f08d49',
        toggleType: 'soft',
        settingsPath: 'westworld',
        settingsKey: 'directorSuffixEnabled',
        checkboxId: '',
    },
];

function findFullName(shortName) {
    const thirdPartyName = `third-party/${shortName}`;
    if (extensionNames.includes(thirdPartyName)) return thirdPartyName;
    if (extensionNames.includes(shortName)) return shortName;
    return null;
}

function getSettings(cfg) {
    return extension_settings[cfg.settingsPath];
}

function isSoftEnabled(cfg) {
    const $checkbox = cfg.checkboxId ? $(cfg.checkboxId) : $();
    if ($checkbox.length) return $checkbox.prop('checked');

    const settings = getSettings(cfg);
    if (!settings) return false;
    return settings[cfg.settingsKey] !== false;
}

function isHardEnabled(cfg) {
    const disabled = extension_settings.disabledExtensions || [];
    return !disabled.includes(cfg._fullName);
}

function isEnabled(cfg) {
    return cfg.toggleType === 'hard' ? isHardEnabled(cfg) : isSoftEnabled(cfg);
}

function softToggle(cfg) {
    const $checkbox = cfg.checkboxId ? $(cfg.checkboxId) : $();
    if ($checkbox.length) {
        $checkbox.prop('checked', !$checkbox.prop('checked')).trigger('change');
        return true;
    }

    const settings = getSettings(cfg);
    if (!settings || typeof settings[cfg.settingsKey] === 'undefined') {
        globalThis.toastr?.warning?.(`无法切换 ${cfg.label}，请先进入扩展设置面板让设置加载`);
        return false;
    }

    settings[cfg.settingsKey] = !settings[cfg.settingsKey];
    saveSettingsDebounced();
    return true;
}

async function hardToggle(cfg) {
    if (isHardEnabled(cfg)) {
        await disableExtension(cfg._fullName);
    } else {
        await enableExtension(cfg._fullName);
    }
    return true;
}

function toggleEnabled(cfg) {
    return cfg.toggleType === 'hard' ? hardToggle(cfg) : softToggle(cfg);
}

function createToggleUI() {
    const matched = [];
    for (const cfg of extConfigs) {
        if (cfg.quickToggleEnabled === false) continue;

        if (cfg.toggleType === 'hard') {
            cfg._fullName = findFullName(cfg.key);
            if (cfg._fullName) {
                matched.push(cfg);
            } else {
                console.warn(`[ext-quick-toggle] "${cfg.key}" 未安装，按钮不显示`);
            }
            continue;
        }

        if (getSettings(cfg)) {
            matched.push(cfg);
        } else {
            console.warn(`[ext-quick-toggle] "${cfg.key}" 未安装，按钮不显示`);
        }
    }

    $('#ext_qt_ve, #ext_qt_lwb, #ext_qt_ww, #ext_qt_ww_director_suffix').remove();
    if (matched.length === 0) return;

    const $targetHr = $('.options-content').find('hr').last();
    const btnIdMap = {
        'vectors-enhanced': 'ext_qt_ve',
        LittleWhiteBox: 'ext_qt_lwb',
        WestWorld: 'ext_qt_ww',
        'WestWorld-director-suffix': 'ext_qt_ww_director_suffix',
    };

    for (const cfg of matched) {
        const btnId = btnIdMap[cfg.key];
        const $icon = $('<i>', { class: `fa-lg ${cfg.icon}`, css: { paddingRight: '12px' } });
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
                if (cfg.toggleType === 'hard') return;

                if (ok) {
                    refreshLabel();
                    globalThis.toastr?.success?.(`${cfg.label} 已${isEnabled(cfg) ? '启用' : '关闭'}`);
                }
            } catch (error) {
                console.error(`[ext-quick-toggle] 切换 ${cfg.label} 失败:`, error);
                globalThis.toastr?.error?.(`切换 ${cfg.label} 失败`);
            }
        });
    }
}

let done = false;
function tryInit() {
    if (done || extensionNames.length === 0) return;
    done = true;
    jQuery(createToggleUI);
}

tryInit();
eventSource.on(event_types.EXTENSION_SETTINGS_LOADED, tryInit);
