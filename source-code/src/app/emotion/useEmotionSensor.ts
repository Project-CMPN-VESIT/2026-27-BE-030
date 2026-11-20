import { useSyncExternalStore } from "react";
import { emotionSensor } from "./sensor";

/** Live sensor status (off / starting / on / error), camera stream and face visibility. */
export function useEmotionSensor() {
  return useSyncExternalStore(emotionSensor.subscribe, emotionSensor.getSnapshot);
}
