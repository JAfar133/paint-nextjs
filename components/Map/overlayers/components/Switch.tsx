import React, {ChangeEventHandler} from 'react';
import s from './Switch.module.scss'
interface SwitchProps {
  value: boolean,
  onChange: any,
  rounded: boolean
}
const Switch = ({value, onChange, rounded}: SwitchProps) => {
  return (
      <>
        <input className={s.react_switch_checkbox} id={`react-switch-new`} type='checkbox' checked={value} onChange={onChange} />
        <label
            className={s.react_switch_label}
            htmlFor={`react-switch-new`}
        >
          <span className={s.react_switch_button} />
        </label>
      </>
  );
};

export default Switch;