// الجلسة 7 - التجربة 4: القفل (Mutex)
// مهمتان تكتبان جملة على الشاشة حرفاً حرفاً. والشاشة شيء مشترك.
// غيّر USE_MUTEX بين 0 و 1 وقارن السطور.

#define USE_MUTEX 0

SemaphoreHandle_t screenLock;

void printSlowly(const char *text) {           // كتابة بطيئة، حتى نرى التداخل بوضوح
  for (const char *c = text; *c; c++) {
    Serial.print(*c);
    vTaskDelay(pdMS_TO_TICKS(2));
  }
  Serial.println();
}

void writer(void *param) {
  const char *text = (const char *)param;
  for (;;) {
#if USE_MUTEX
    xSemaphoreTake(screenLock, portMAX_DELAY);  // خذ القفل، وانتظر إذا كان مأخوذاً
#endif
    printSlowly(text);                          // القسم الحرج
#if USE_MUTEX
    xSemaphoreGive(screenLock);                 // أعد القفل
#endif
    vTaskDelay(pdMS_TO_TICKS(300));
  }
}

void setup() {
  Serial.begin(115200);
  screenLock = xSemaphoreCreateMutex();         // قفل فيه وراثة الأولوية تلقائياً
  xTaskCreatePinnedToCore(writer, "A", 2048, (void *)"AAAAAAAAAAAAAAAAAAAA", 1, NULL, 1);
  xTaskCreatePinnedToCore(writer, "B", 2048, (void *)"bbbbbbbbbbbbbbbbbbbb", 1, NULL, 1);
}

void loop() {
  vTaskDelay(portMAX_DELAY);
}
