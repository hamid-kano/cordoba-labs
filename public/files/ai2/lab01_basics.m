%% الجلسة 1: الخطوة الأولى في MATLAB
%  شغّل كل قسم وحده بـ Run Section (Ctrl + Enter)، أو الملف كله بـ Run (F5)
clc; clear; close all;

%% 1. أوامر بسيطة
a = 5
b = 3
c = a + b
d = a * b

%% 2. المتجهات
t = 0:1:5
t = 0:0.5:5

%% 3. أول رسم
t = 0:0.01:5;             % الزمن من 0 إلى 5 ثوانٍ
y = sin(2*pi*t);          % موجة جيبية
figure;
plot(t, y)
grid on
xlabel('Time (s)')
ylabel('y')
title('My first plot')

%% 4. نظام واستجابته
s = tf('s');
G = 1 / (s*(0.5*s + 1))   % نظامنا

T = feedback(G, 1);       % حلقة مغلقة
figure;
step(T)                   % أمر "اذهب إلى 1"
grid on
stepinfo(T)               % التجاوز وزمن الاستقرار وغيرهما

%% المثال 1: علامات الطلاب
marks = [85 92 73 60 48];        % علامات 5 طلاب
avg     = mean(marks)            % المعدل
best    = max(marks)             % أعلى علامة
worst   = min(marks)             % أدنى علامة
passed  = sum(marks >= 60)       % عدد الناجحين (60 فما فوق)
ordered = sort(marks, 'descend') % ترتيب من الأعلى
figure;
bar(marks)
title('Student marks')

%% المثال 2: تحويل درجة الحرارة
C = 0:10:100;                % من 0 إلى 100، والخطوة 10
F = C * 9/5 + 32;            % التحويل لكل القيم معاً
result = [C' F']             % جدول: عمود مئوي وعمود فهرنهايت
body   = 37 * 9/5 + 32       % حرارة جسم الإنسان
figure;
plot(C, F, 'o-')
grid on
xlabel('Celsius'), ylabel('Fahrenheit')

%% المثال 3: سقوط حجر من ارتفاع 45 m
t = 0:0.1:3;                 % الزمن من 0 إلى 3 ثوانٍ
h = 45 - 4.9 * t.^2;         % النقطة قبل ^ تعني تربيع كل رقم وحده
figure;
plot(t, h, 'LineWidth', 2)
grid on
xlabel('Time (s)'), ylabel('Height (m)')
h_end = h(end)               % الارتفاع عند t = 3

%% المثال 4: سخان ماء
s = tf('s');
H = 1 / (5*s + 1)            % كلما كبر الرقم 5 صار السخان أبطأ
figure;
step(H)
grid on
info = stepinfo(H);
rise   = info.RiseTime       % زمن الصعود
settle = info.SettlingTime   % زمن الاستقرار
over   = info.Overshoot      % التجاوز

%% 5. الوظيفة: ربح أكبر
T4 = feedback(4*G, 1);
figure;
step(T, T4)
grid on
legend('ربح 1', 'ربح 4')
stepinfo(T4)
