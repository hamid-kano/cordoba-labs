// الجلسة 8 - قالب المشروع: مهام دورية على FreeRTOS
// املأ جدول tasks من تصميمك (الاسم بأحرف إنكليزية، C، T، الأولوية)، ثم شغّل وراقب الطرفية.
// كل مهمة «تعمل» C ms ثم تنام حتى موعدها التالي، وتسجّل زمن استجابتها وأسوأ قيمة له.

struct TaskInfo {
  const char *name;
  uint32_t C;            // زمن التنفيذ (ms)
  uint32_t T;            // الدور = المهلة (ms)
  UBaseType_t prio;      // الأولوية في FreeRTOS: الرقم الأكبر هو الأعلى
  volatile uint32_t runs, worst, misses;
};

TaskInfo tasks[] = {
  // الاسم        C   T    الأولوية   (اترك الأصفار الثلاثة الأخيرة كما هي)
  { "task1",      1,  10,  2,         0, 0, 0 },
  { "task2",      2,  20,  1,         0, 0, 0 },
};
const int N = sizeof(tasks) / sizeof(tasks[0]);

SemaphoreHandle_t screenLock;   // الطرفية مورد مشترك
uint32_t loopsPerMs = 0;        // يُحسب في setup

// عمل حقيقي يستهلك C ms من وقت المعالج نفسه (لا من الساعة)،
// حتى إذا قُطعت المهمة في منتصفه أكملت ما بقي لها بعد أن تعود.
void busyWork(uint32_t ms) {
  for (volatile uint32_t i = 0; i < ms * loopsPerMs; i++) { }
}

void periodic(void *param) {
  TaskInfo *t = (TaskInfo *)param;
  TickType_t release = xTaskGetTickCount();
  for (;;) {
    vTaskDelayUntil(&release, pdMS_TO_TICKS(t->T));   // release = لحظة وصول هذه النسخة
    busyWork(t->C);
    uint32_t resp = (xTaskGetTickCount() - release) * portTICK_PERIOD_MS;  // زمن الاستجابة
    t->runs++;
    if (resp > t->worst) t->worst = resp;
    if (resp > t->T) t->misses++;                       // فاتت المهلة
  }
}

void reporter(void *param) {                          // أقل أولوية: يطبع الملخص كل ثانيتين
  for (;;) {
    vTaskDelay(pdMS_TO_TICKS(2000));
    xSemaphoreTake(screenLock, portMAX_DELAY);
    Serial.printf("---- t = %lu ms ----\n", millis());
    for (int i = 0; i < N; i++)
      Serial.printf("%-10s C=%2lu T=%3lu prio=%u  runs=%4lu  worst=%3lu ms  misses=%lu\n",
                    tasks[i].name, tasks[i].C, tasks[i].T, (unsigned)tasks[i].prio,
                    tasks[i].runs, tasks[i].worst, tasks[i].misses);
    xSemaphoreGive(screenLock);
  }
}

void setup() {
  Serial.begin(115200);
  screenLock = xSemaphoreCreateMutex();

  // معايرة: كم دورة من حلقة busyWork نفسها في 1 ms؟ (قبل إنشاء المهام، والمعالج لنا وحدنا)
  uint32_t start = millis();
  uint32_t count = 0;
  while (millis() - start < 100) {
    for (volatile uint32_t i = 0; i < 1000; i++) { }
    count += 1000;
  }
  loopsPerMs = count / 100;
  if (loopsPerMs == 0) loopsPerMs = 1;
  Serial.printf("calibration: %lu loops per ms\n", loopsPerMs);

  for (int i = 0; i < N; i++)
    xTaskCreatePinnedToCore(periodic, tasks[i].name, 4096, &tasks[i], tasks[i].prio, NULL, 1);
  xTaskCreatePinnedToCore(reporter, "report", 4096, NULL, 0, NULL, 1);
}

void loop() {
  vTaskDelay(portMAX_DELAY);
}
