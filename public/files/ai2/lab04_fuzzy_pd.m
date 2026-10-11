%% الجلسة 4: أول متحكم ضبابي (Fuzzy-PD)
%  يحتاج: Fuzzy Logic Toolbox (R2018b أو أحدث)، والملف simFuzzy.m بنفس المجلد
%  شغّل كل قسم لحاله بـ Run Section
clc; clear; close all;

%% 1. بناء المتحكم
fis = mamfis('Name', 'fuzzyPD');

% المدخل الأول: الخطأ e
fis = addInput(fis, [-1 1], 'Name', 'e');
fis = addMF(fis, 'e', 'trimf', [-2 -1 0], 'Name', 'N');
fis = addMF(fis, 'e', 'trimf', [-1  0 1], 'Name', 'Z');
fis = addMF(fis, 'e', 'trimf', [ 0  1 2], 'Name', 'P');

% المدخل التاني: تغيّر الخطأ de
fis = addInput(fis, [-1 1], 'Name', 'de');
fis = addMF(fis, 'de', 'trimf', [-2 -1 0], 'Name', 'N');
fis = addMF(fis, 'de', 'trimf', [-1  0 1], 'Name', 'Z');
fis = addMF(fis, 'de', 'trimf', [ 0  1 2], 'Name', 'P');

% الخرج: الدفعة u
fis = addOutput(fis, [-1 1], 'Name', 'u');
fis = addMF(fis, 'u', 'trimf', [-1.5 -1   -0.5], 'Name', 'NB');
fis = addMF(fis, 'u', 'trimf', [-1   -0.5  0  ], 'Name', 'NS');
fis = addMF(fis, 'u', 'trimf', [-0.5  0    0.5], 'Name', 'Z');
fis = addMF(fis, 'u', 'trimf', [ 0    0.5  1  ], 'Name', 'PS');
fis = addMF(fis, 'u', 'trimf', [ 0.5  1    1.5], 'Name', 'PB');

% القواعد التسعة
rules = [
    "If e is N and de is N then u is NB"
    "If e is N and de is Z then u is NS"
    "If e is N and de is P then u is Z"
    "If e is Z and de is N then u is NS"
    "If e is Z and de is Z then u is Z"
    "If e is Z and de is P then u is PS"
    "If e is P and de is N then u is Z"
    "If e is P and de is Z then u is PS"
    "If e is P and de is P then u is PB"
];
fis = addRule(fis, rules);

writeFIS(fis, 'fuzzyPD');      % حفظ بملف fuzzyPD.fis

%% 2. شكل المتحكم
figure; gensurf(fis);

%% 3. تجربة بسطر واحد
simFuzzy(fis, 1, 0.3, 4)       % تجاوز ≈ 0.9%، زمن استقرار ≈ 2.1 s

%% 4. متغيرات نموذج Simulink (lab04_fuzzy.slx)
Ke = 1; Kd = 0.3; Ku = 4;
if exist('lab04_fuzzy.slx', 'file')
    open_system('lab04_fuzzy');
    sim('lab04_fuzzy');
end

%% 5. مقارنة مع PD
s = tf('s'); G = 1/(s*(0.5*s+1));
C = pidtune(G, 'PD');
[t, yF] = simFuzzy(fis, 1, 0.3, 4);
yP = step(feedback(C*G, 1), t);
figure; plot(t, yF, t, yP, '--', 'LineWidth', 1.5); grid on;
legend('Fuzzy', 'PD'); xlabel('Time (s)'); ylabel('y');
