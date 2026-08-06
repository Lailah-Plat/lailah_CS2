import React from 'react';

interface SettingToggleProps {
  label: string;
  description?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingToggle = ({
  label,
  description,
  defaultChecked,
  checked,
  onChange,
}: SettingToggleProps) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-200 transition-colors">
    <div>
      <span className="block text-sm font-bold text-slate-700">{label}</span>
      {description && <span className="block text-xs text-slate-500 mt-1">{description}</span>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
    </label>
  </div>
);

interface SettingInputProps {
  label: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
  description?: string;
  suffix?: string;
  prefix?: string;
  dir?: string;
  value?: string | number;
  onChange?: (e: any) => void;
}

export const SettingInput = ({
  label,
  type = 'text',
  defaultValue,
  placeholder,
  description,
  suffix,
  prefix,
  dir,
  value,
  onChange,
}: SettingInputProps) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative flex items-center">
      {prefix && <span className="absolute right-3 text-slate-400 text-sm">{prefix}</span>}
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left ${prefix ? 'pr-10' : ''} ${suffix ? 'pl-10' : ''}`}
        dir={dir || (type === 'number' || type === 'email' ? 'ltr' : 'auto')}
      />
      {suffix && <span className="absolute left-3 text-slate-400 text-sm">{suffix}</span>}
    </div>
    {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
  </div>
);

interface SettingInputStateProps {
  label: string;
  type?: string;
  value?: string | number;
  onChange?: (e: any) => void;
  placeholder?: string;
  description?: string;
  suffix?: string;
  prefix?: string;
  dir?: string;
}

export const SettingInputState = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  description,
  suffix,
  prefix,
  dir,
}: SettingInputStateProps) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative flex items-center">
      {prefix && <span className="absolute right-3 text-slate-400 text-sm">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left ${prefix ? 'pr-10' : ''} ${suffix ? 'pl-10' : ''}`}
        dir={dir || (type === 'number' || type === 'email' ? 'ltr' : 'auto')}
      />
      {suffix && <span className="absolute left-3 text-slate-400 text-sm">{suffix}</span>}
    </div>
    {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
  </div>
);
