// الجلسة 7 - التجربة 1: مهمتان تعملان معاً على FreeRTOS
// المصباح الأحمر يتبدل كل 500 ms، والأخضر كل 200 ms، وكل مهمة لا تعرف شيئاً عن الأخرى.

#define LED_RED   18
#define LED_GREEN 19

void redTask(void *param) {
  bool on = false;
  pinMode(LED_RED, OUTPUT);
  for (;;) {                                   // حلقة المهمة: لا تنتهي أبداً
    on = !on;
    digitalWrite(LED_RED, on);
    Serial.printf("[%6lu ms] red   %s\n", millis(), on ? "ON" : "off");
    vTaskDelay(pdMS_TO_TICKS(500));            // نامي 500 ms، والمعالج حر لغيرك
  }
}

void greenTask(void *param) {
  bool on = false;
  pinMode(LED_GREEN, OUTPUT);
  for (;;) {
    on = !on;
    digitalWrite(LED_GREEN, on);
    Serial.printf("[%6lu ms] green %s\n", millis(), on ? "ON" : "off");
    vTaskDelay(pdMS_TO_TICKS(200));
  }
}

void setup() {
  Serial.begin(115200);
  // (الدالة، الاسم، حجم المكدس، معامل، الأولوية، مقبض، النواة)
  // نضع كل المهام على النواة 1 حتى يكون عندنا معالج واحد كما في الجلسات السابقة
  xTaskCreatePinnedToCore(redTask,   "red",   2048, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(greenTask, "green", 2048, NULL, 1, NULL, 1);
}

void loop() {
  vTaskDelay(portMAX_DELAY);                   // loop لا تعمل شيئاً: المهام تقوم بكل العمل
}
