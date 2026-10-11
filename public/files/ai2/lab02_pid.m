%% الجلسة 2: متحكم PID
%  شغّل كل قسم لحاله بـ Run Section
clc; clear; close all;

s = tf('s');
G = 1 / (s*(0.5*s + 1));      % النظام تبعنا

%% 1. تجارب الضبط اليدوي (بدون Saturation)
P = [1 5 5 5];  I = [0 0 0 0.5];  D = [0 0 1 1];
figure; hold on; grid on;
for k = 1:4
    C = pid(P(k), I(k), D(k));
    step(feedback(C*G, 1), 10);
end
legend('أ: P=1', 'ب: P=5', 'ج: P=5, D=1', 'د: P=5, I=0.5, D=1');
title('تجارب الضبط اليدوي');

%% 2. الضبط التلقائي
C = pidtune(G, 'PID')         % القيم المقترحة
figure;
step(feedback(C*G, 1)); grid on;
title('PID من pidtune');
stepinfo(feedback(C*G, 1))

%% 3. تشغيل نموذج Simulink (لازم يكون lab02_pid.slx بنفس المجلد)
if exist('lab02_pid.slx', 'file')
    open_system('lab02_pid');
    sim('lab02_pid');
else
    disp('ما لقيت lab02_pid.slx. ابنيه متل الخطوة 1 بصفحة الجلسة.');
end
