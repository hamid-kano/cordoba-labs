%% الجلسة 8: قالب المشروع
%  يحتاج: simFuzzy.m و buildFuzzyPD.m بنفس المجلد
%  1) اختار رقم المشروع   2) غيّر الأزرار بالقسم 3 لحتى تحقق المطلوب
clc; clear; close all;

project = 1;     % 1: ذراع روبوت   2: سرعة محرك   3: فرن

%% 1. النظام
switch project
    case 1
        name = 'ذراع روبوت';
        G = tf(1, [1 1 0]);              % 1 / (s(s+1))
        Limits = [-5 5];  Time = 10;
        goal = 'تجاوز أقل من 5%، واستقرار أقل من 2.5 ثانية';
    case 2
        name = 'سرعة محرك';
        G = tf(1, [0.2 1.2 1]);          % 1 / ((s+1)(0.2s+1))
        Limits = [-5 5];  Time = 10;
        goal = 'يوصل لـ 1 بالضبط، تجاوز أقل من 10%، واستقرار أقل من 3 ثواني';
    case 3
        name = 'فرن';
        G = tf(1, [10 1]);               % 1 / (10s+1)
        Limits = [0 5];   Time = 60;
        goal = 'يوصل لـ 1 بالضبط، تجاوز أقل من 5%، واستقرار أقل من 10 ثواني';
end
fprintf('المشروع: %s\nالمطلوب: %s\n\n', name, goal);

%% 2. المتحكم العائم
fis = buildFuzzyPD(3);

%% 3. الأزرار: غيّر هون
Ke = 1;  Kd = 0.3;  Ku = 4;  Ki = 0;

simFuzzy(fis, Ke, Kd, Ku, 'Ki', Ki, 'Plant', G, 'Limits', Limits, 'Time', Time)

%% 4. المقارنة مع PID
C = pidtune(G, 'PID');
[t, yF] = simFuzzy(fis, Ke, Kd, Ku, 'Ki', Ki, 'Plant', G, 'Limits', Limits, 'Time', Time);
yP = step(feedback(C*G, 1), t);

figure;
plot(t, yF, t, yP, '--', 'LineWidth', 1.5); grid on;
legend('Fuzzy', 'PID'); xlabel('Time (s)'); ylabel('y'); title(name);

S = stepinfo(yP, t, 1);
fprintf('PID:  التجاوز = %.1f %%   زمن الاستقرار = %.2f s\n', S.Overshoot, S.SettlingTime);
