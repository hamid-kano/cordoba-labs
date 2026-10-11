%% الجلسة 6: Sugeno، وإلغاء الخطأ المستقر
%  يحتاج: simFuzzy.m و buildFuzzyPD.m بنفس المجلد
%  شغّل كل قسم لحاله بـ Run Section
clc; clear; close all;

%% 1. المتحكمين
mam = buildFuzzyPD(3);              % Mamdani
sug = buildFuzzyPD(3, 'sugeno');    % Sugeno

%% 2. مقارنة الأجوبة
evalfis(mam, [0.5 -0.2])
evalfis(sug, [0.5 -0.2])
evalfis(mam, [1 1])                 % 0.84
evalfis(sug, [1 1])                 % 1

%% 3. السطحين والاستجابة
figure;
subplot(1,2,1); gensurf(mam); title('Mamdani');
subplot(1,2,2); gensurf(sug); title('Sugeno');
simFuzzy(mam, 1, 0.3, 4)
simFuzzy(sug, 1, 0.3, 4)

%% 4. اضطراب بدون تكامل
simFuzzy(mam, 1, 0.3, 4, 'Disturbance', 0.5, 'Time', 20)      % بيستقر عند ≈ 1.21

%% 5. اضطراب مع تكامل
simFuzzy(mam, 1, 0.3, 4, 'Disturbance', 0.5, 'Time', 20, 'Ki', 1)   % بيرجع لـ 1

%% 6. متغيرات نموذج Simulink (lab06_fuzzy_pid.slx)
Ke = 1; Kd = 0.3; Ku = 4; Ki = 0.5;
fis = mam;
if exist('lab06_fuzzy_pid.slx', 'file')
    open_system('lab06_fuzzy_pid');
    sim('lab06_fuzzy_pid');
end
