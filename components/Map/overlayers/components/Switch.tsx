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
        <label className={s.switch}>
          <input type='checkbox' checked={value} onChange={onChange} />
          <span className={`${s.slider} ${rounded ? s.rounded : ''}`}></span>
        </label>
      </>
  );
};

export default Switch;