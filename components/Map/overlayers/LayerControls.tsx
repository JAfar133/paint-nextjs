import React, {
  ChangeEventHandler,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react';
import style from './LayerControls.module.scss';
import {
  formatDate,
  formatDateTime,
  getMaxForecastDate,
  getMinForecastDate,
  isDatesEqual,
  reformatDate,
  reformatDateTime
} from "../utils/dateFunctionss";
import {RainIcon, TemperatureIcon, WindIcon} from "evergreen-ui";
import {Cloud, Droplets, Gauge, Umbrella} from "lucide-react";
import {FORECAST_STEP, LayersName, MAX_FORECAST_HOURS, WEATHER_CYCLE_STEP} from "./config";
import {gradient, GradientData, units} from "./canvas-layer/gradient";
import Switch from "./components/Switch";

interface LayerControlsProps {
  layerChange: (newLayer: LayersName) => void;
  selectedLayer: string;
  forecastDate: Date;
  forecastDateChange: (date: Date) => void;
  showWindy: boolean,
  setShowWindy: Dispatch<SetStateAction<boolean>>
}

interface LayerSelect {
  value: LayersName;
  name: string;
  icon: any
}

export const layers: LayerSelect[] = [
  {value: "wind", name: "Ветер", icon: <WindIcon/>},
  {value: "apcp", name: "Осадки (за 3ч)", icon: <RainIcon/>},
  {value: "tmp", name: "Температура", icon: <TemperatureIcon/>},
  {value: "pres", name: "Давление", icon: <Gauge/>},
  {value: "rh", name: "Влажность", icon: <Droplets/>},
  {value: "tcdc", name: "Облачность", icon: <Cloud/>},
]

const LayerControls: React.FC<LayerControlsProps> = (
    {
      selectedLayer,
      layerChange,
      forecastDate,
      forecastDateChange,
      showWindy,
      setShowWindy
    }) => {

  const [active, setActive] = useState(false);
  const [layer, setLayer] = useState<LayerSelect | null>(null);
  const [forecastRange, setForecastRange] = useState<Map<string, string[]>>()
  const [selectedRangeDate, setSelectedRangeDate] = useState<string>("")
  const [selectedRangeTime, setSelectedRangeTime] = useState<string>("")
  const [plusHourDisabled, setPlusHourDisabled] = useState<boolean>()
  const [minusHourDisabled, setMinusHourDisabled] = useState<boolean>()
  const [minForecastDate, setMinForecastDate] = useState<Date>(new Date());
  const [maxForecastDate, setMaxForecastDate] = useState<Date>(new Date());
  const [linearGradient, setLinearGradient] = useState<string[]>();
  const selectRef = useRef<HTMLDivElement>(null)
  const dateRangeRef = useRef<HTMLDivElement>(null)
  const handleDefaultOptionClick = () => {
    setActive(!active);
  };

  const handleLayerClick = (layer: LayerSelect) => {
    setActive(false);
    setLayer(layer);
    layerChange(layer.value);
  };

  useEffect(() => {
    if (forecastDate && minForecastDate && maxForecastDate) {
      const rangeDate = formatDateTime(forecastDate)
      setSelectedRangeDate(rangeDate.slice(0, -2))
      setSelectedRangeTime(rangeDate.slice(-2))

      if (isDatesEqual(forecastDate, maxForecastDate)) {
        setPlusHourDisabled(true)
      } else {
        setPlusHourDisabled(false)
      }

      if (isDatesEqual(forecastDate, minForecastDate)) {
        setMinusHourDisabled(true)
      } else {
        setMinusHourDisabled(false)
      }
    }
  }, [forecastDate, minForecastDate, maxForecastDate])

  useEffect(() => {
    layers.forEach(layer => {
      if (layer.value === selectedLayer) {
        setLayer(layer)
      }
    })
  }, [selectedLayer])

  useEffect(() => {
    if (layer) {
      const gradientData = gradient[layer.value]
      const linearGradient = getLinearGradient(gradientData)
      setLinearGradient(linearGradient)
    }
  }, [layer])

  useEffect(() => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    let dateArray = new Map();
    const hours = Array.from(
        {length: 24 / FORECAST_STEP},
        (_, index) => String(index * FORECAST_STEP).padStart(2, '0')
    );
    let remainingHours = MAX_FORECAST_HOURS + FORECAST_STEP;
    let i = 0;

    while (remainingHours > 0) {
      const nextDate = new Date(currentDate.getTime() + i * 60 * 60 * 1000);
      const currentHours = Math.min(remainingHours, 24);
      dateArray.set(formatDate(nextDate), hours.slice(0, currentHours / FORECAST_STEP));

      remainingHours -= currentHours;
      i += 24;
    }

    setForecastRange(dateArray);
    setMaxForecastDate(getMaxForecastDate(currentDate));
    setMinForecastDate(getMinForecastDate(currentDate));

  }, []);
  useEffect(() => {
    if (selectRef.current && dateRangeRef.current) {
      L.DomEvent.disableClickPropagation(selectRef.current);
      L.DomEvent.disableClickPropagation(dateRangeRef.current);
    }
  }, [selectRef.current, dateRangeRef.current])

  const handleDateChange = (date: string) => {
    forecastDateChange(reformatDateTime(date));
  };
  const addHour = (step: number) => {
    const newForecastDate = new Date(forecastDate)

    if (!((step > 0 && isDatesEqual(forecastDate, maxForecastDate)) ||
        (step < 0 && isDatesEqual(forecastDate, minForecastDate)))) {
      newForecastDate.setHours(newForecastDate.getHours() + step);
      forecastDateChange(newForecastDate);
    }
  }
  const formatDateForSelect = (date: string) => {
    const formatDate = reformatDate(date)
    const options = {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    } as Intl.DateTimeFormatOptions;
    const formatData = new Intl.DateTimeFormat('ru-RU', options).format(formatDate).replaceAll(',', ' -').replace(' -', '.');
    return formatData.charAt(0).toUpperCase() + formatData.slice(1);
  };

  const getLinearGradient = (gradientData: GradientData[]) => {
    return gradientData.map(gr =>
        `rgba(${gr.data[0]}, ${gr.data[1]}, ${gr.data[2]}, 0.7)`
    )
  }
  const handleWindySwitch = (): any => {
    setShowWindy(!showWindy)
  }

  const forecastTimeToDayPart = (time: string): string =>
      ({ '00': 'ночь', '06': 'утро', '12': 'день' }[time]) || 'вечер';

  return (
      layer && (
          <>
            <div className={`${style.select_wrap} ${active ? style.active : ''}`} ref={selectRef}>
              <ul onClick={handleDefaultOptionClick} className={style.default_option}>
                <li>
                  <div className={style.option}>
                    {layer.icon}
                    <p>{layer.name}</p>
                  </div>
                </li>
              </ul>
              <ul className={style.select_ul}>
                {layers.map((mapLayer) => (
                    <li
                        key={mapLayer.value}
                        onClick={() => handleLayerClick(mapLayer)}
                        style={{background: mapLayer.value === layer.value ? '#fff' : ''}}
                    >
                      <div className={style.option}>
                        {mapLayer.icon}
                        <p>{mapLayer.name}</p>
                      </div>
                    </li>
                ))}
              </ul>
            </div>
            <>
                  <div className={style.rh_bottom} ref={dateRangeRef}>
                    <div className={style.step_control}>
                      <div className={style.add_hour}>
                      <span
                          className={`${style.plus} ${style.step} ${minusHourDisabled ? style.disabled : ""}`}
                          onClick={() => addHour(-FORECAST_STEP)}
                      >
                        -{FORECAST_STEP}ч
                      </span>
                      </div>
                      <div className={style.forecast_datetime_select}>
                        <div className={style.time_range_step}>
                          {forecastRange &&
                              forecastRange.get(selectedRangeDate)?.map((time) =>
                                      <span
                                          key={time}
                                          className={`${style.timeSpan} ${style.step} ${time === selectedRangeTime ? style.activeTime : ''}`}
                                          onClick={() => {
                                            setSelectedRangeTime(time);
                                            handleDateChange(`${selectedRangeDate}${time}`)
                                          }}
                                      >
                              {forecastTimeToDayPart(time)}
                            </span>
                              )
                          }
                        </div>
                        <div className={style.forecast_date_select}>
                          {forecastRange && selectedRangeDate &&
                              Array.from(forecastRange.keys()).map((date) => (
                                  <span
                                      key={date.toString()}
                                      className={`${style.timeSpan} ${style.step} ${date === selectedRangeDate ? style.activeTime : ''}`}
                                      onClick={() => {
                                        setSelectedRangeDate(date);
                                        if (reformatDateTime(`${date}${selectedRangeTime}`).getTime() > maxForecastDate.getTime()) {

                                          handleDateChange(`${date}00`)
                                          setSelectedRangeTime('00')
                                        } else handleDateChange(`${date}${selectedRangeTime}`)
                                      }}
                                  >
                                {formatDateForSelect(date)}
                              </span>
                              ))}
                        </div>
                      </div>
                      <div className={style.add_hour}>
                      <span
                          className={`${style.minus} ${style.step} ${plusHourDisabled ? style.disabled : ""}`}
                          onClick={() => addHour(FORECAST_STEP)}
                      >
                        +{FORECAST_STEP}ч
                      </span>
                      </div>
                    </div>
                    <div className={style.windy_switch}>
                      <span onClick={() => handleWindySwitch()}>анимация ветра</span>
                      <Switch value={showWindy} onChange={handleWindySwitch} rounded={true}/>
                    </div>
                  </div>
                  <div className={style.gradient_section}>
                    {linearGradient && !!linearGradient.length &&
                      <div className={style.gradient}
                           style={{background: `linear-gradient(${window.innerWidth > 768 ? 'to top' : 'to right'}, ${linearGradient[0]}, ${linearGradient.join(',')})`}}>
                        <span>{units[layer.value]}</span>
                        {
                          gradient[layer.value].map(gr =>
                              <span key={gr.data.join(',')}>{layer.value !== "tmp" ? gr.value : gr.value - 273}</span>
                          )
                        }
                      </div>
                    }

                  </div>
                </>


          </>
      )

  );
}

export default LayerControls;
