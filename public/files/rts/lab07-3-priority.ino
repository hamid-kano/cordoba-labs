// الجلسة 7 - التجربة 3: الأولوية والمقاطعة
// مهمة الحسّاس تريد أن تعمل كل 100 ms، ومهمة ثقيلة تشغل المعالج 400 ms كل ثانية.
// غيّر HEAVY_PRIO: إذا كانت أقل من أولوية الحسّاس (3) فلا يتأخر الحسّاس، وإذا كانت أعلى فيتأخر.

#define HEAVY_PRIO 1          // جرّب 1 ثم 4

#define LED_RED   18          // الأحمر: المهمة الثقيلة تعمل
#define LED_GREEN 19          // الأخضر: نبضة الحسّاس

void busyWork(uint32_t ms) {
  uint32_t start = millis();
  while (millis() - start < ms) { }
}

void sensorTask(void *param) {                 // الأولوية 3
  pinMode(LED_GREEN, OUTPUT);
  TickType_t lastWake = xTaskGetTickCount();
  for (;;) {
    vTaskDelayUntil(&lastWake, pdMS_TO_TICKS(100));
    // lastWake هو الموعد المطلوب، والفرق بينه وبين الآن هو التأخير
    uint32_t late = (xTaskGetTickCount() - lastWake) * portTICK_PERIOD_MS;
    digitalWrite(LED_GREEN, HIGH);
    busyWork(5);                               // C = 5 ms
    digitalWrite(LED_GREEN, LOW);
    Serial.printf("[%6lu ms] sensor  late = %3lu ms%s\n", millis(), late, late > 10 ? "   <-- LATE" : "");
  }
}

void heavyTask(void *param) {                  // الأولوية HEAVY_PRIO
  pinMode(LED_RED, OUTPUT);
  for (;;) {
    digitalWrite(LED_RED, HIGH);
    Serial.printf("[%6lu ms] heavy   start\n", millis());
    busyWork(400);                             // عمل طويل دون نوم
    digitalWrite(LED_RED, LOW);
    vTaskDelay(pdMS_TO_TICKS(600));
  }
}

void setup() {
  Serial.begin(115200);
  xTaskCreatePinnedToCore(sensorTask, "sensor", 4096, NULL, 3,          NULL, 1);
  xTaskCreatePinnedToCore(heavyTask,  "heavy",  4096, NULL, HEAVY_PRIO, NULL, 1);
}

void loop() {
  vTaskDelay(portMAX_DELAY);
}
