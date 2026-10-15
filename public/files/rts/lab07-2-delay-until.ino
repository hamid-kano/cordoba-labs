// الجلسة 7 - التجربة 2: vTaskDelay أم vTaskDelayUntil؟
// المهمة تعمل 30 ms ثم تنام. نريد أن تبدأ كل 100 ms بالضبط.
// غيّر USE_DELAY_UNTIL بين 0 و 1 وقارن العمود diff (الفرق بين بدايتين).

#define USE_DELAY_UNTIL 0

const uint32_t PERIOD_MS = 100;
const uint32_t WORK_MS   = 30;

void busyWork(uint32_t ms) {                   // عمل حقيقي يشغل المعالج (لا نوم)
  uint32_t start = millis();
  while (millis() - start < ms) { }
}

void periodicTask(void *param) {
  TickType_t lastWake = xTaskGetTickCount();
  uint32_t prev = millis();
  for (;;) {
    uint32_t now = millis();
    Serial.printf("start = %6lu ms   diff = %3lu ms\n", now, now - prev);
    prev = now;

    busyWork(WORK_MS);                         // C = 30 ms

#if USE_DELAY_UNTIL
    vTaskDelayUntil(&lastWake, pdMS_TO_TICKS(PERIOD_MS));  // استيقظ عند الموعد التالي بالضبط
#else
    vTaskDelay(pdMS_TO_TICKS(PERIOD_MS));                   // نم 100 ms بعد أن تنتهي
#endif
  }
}

void setup() {
  Serial.begin(115200);
  xTaskCreatePinnedToCore(periodicTask, "periodic", 4096, NULL, 2, NULL, 1);
}

void loop() {
  vTaskDelay(portMAX_DELAY);
}
