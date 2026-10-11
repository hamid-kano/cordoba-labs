%% الجلسة 1: أول خطوة بـ MATLAB
%  شغّل كل قسم لحاله بـ Run Section، أو كل الملف بـ Run
clc; clear; close all;

%% 1. أوامر بسيطة
a = 5
b = 3
c = a + b
d = a * b

%% 2. المتجهات
t = 0:1:5
t = 0:0.5:5

%% 3. أول رسمة
t = 0:0.01:5;             % الزمن من 0 لـ 5 ثواني
y = sin(2*pi*t);          % موجة جيبية
figure;
plot(t, y)
grid on
xlabel('Time (s)')
ylabel('y')
title('My first plot')

%% 4. نظام واستجابته
s = tf('s');
G = 1 / (s*(0.5*s + 1))   % النظام تبعنا

T = feedback(G, 1);       % حلقة مغلقة
figure;
step(T)                   % أمر "روح لـ 1"
grid on
stepinfo(T)               % التجاوز وزمن الاستقرار

%% 5. الوظيفة: ربح أكبر
T4 = feedback(4*G, 1);
figure;
step(T, T4)
grid on
legend('ربح 1', 'ربح 4')
stepinfo(T4)
