%% الجلسة 1: أساسيات MATLAB لأنظمة التحكم
clc; clear; close all;

%% 1. المصفوفات
A = [1 2 3; 4 5 6; 7 8 10];
b = [1; 2; 3];
x = A \ b

%% 2. الرسم
t  = 0:0.01:5;
y1 = exp(-t) .* sin(2*pi*t);
y2 = exp(-0.5*t);
figure;
plot(t, y1, 'LineWidth', 1.5); hold on;
plot(t, y2, '--', 'LineWidth', 1.5);
grid on; xlabel('Time (s)'); ylabel('Amplitude');
legend('e^{-t} sin(2\pi t)', 'e^{-0.5t}'); title('My first plot');

%% 3. تابع التحويل والاستجابة
s = tf('s');
G = 1 / (s*(0.5*s + 1));
T = feedback(G, 1);
figure; step(T); grid on; title('Closed-loop step response');
info = stepinfo(T)
