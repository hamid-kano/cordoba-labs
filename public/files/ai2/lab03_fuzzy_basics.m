%% الجلسة 3: أساسيات المنطق العائم بـ MATLAB
%  مثال: سرعة مروحة حسب درجة الحرارة والرطوبة (Mamdani)
%  يحتاج: Fuzzy Logic Toolbox (R2018b أو أحدث)
clc; clear; close all;

%% 1. دوال الانتماء
T = 0:0.1:40;                               % درجة الحرارة (°C)
muCold = trapmf(T, [0 0 10 20]);
muWarm = trimf(T,  [10 20 30]);
muHot  = trapmf(T, [20 30 40 40]);

figure;
plot(T, muCold, T, muWarm, T, muHot, 'LineWidth', 1.5); grid on;
legend('Cold', 'Warm', 'Hot'); xlabel('Temperature (°C)'); ylabel('\mu');
title('دوال انتماء درجة الحرارة');

% مقارنة أشكال دوال الانتماء على نفس المجال
figure;
plot(T, trimf(T, [10 20 30]), T, trapmf(T, [10 15 25 30]), ...
     T, gaussmf(T, [4 20]), T, gbellmf(T, [6 3 20]), 'LineWidth', 1.5);
grid on; legend('trimf', 'trapmf', 'gaussmf', 'gbellmf');
title('أشكال دوال الانتماء');

%% 2. العمليات العائمة
muAnd = min(muWarm, muHot);                 % تقاطع (AND)
muOr  = max(muWarm, muHot);                 % اتحاد (OR)
muNot = 1 - muWarm;                         % متمم (NOT)

figure;
subplot(3,1,1); plot(T, muAnd, 'LineWidth', 1.5); grid on; title('Warm AND Hot');
subplot(3,1,2); plot(T, muOr,  'LineWidth', 1.5); grid on; title('Warm OR Hot');
subplot(3,1,3); plot(T, muNot, 'LineWidth', 1.5); grid on; title('NOT Warm');

%% 3. الاستدلال Mamdani يدوياً للنقطة (T = 24, H = 45)
t0 = 24; h0 = 45;

% التضبيب
cold = trapmf(t0, [0 0 10 20]);             % 0
warm = trimf(t0,  [10 20 30]);              % 0.6
hot  = trapmf(t0, [20 30 40 40]);           % 0.4
low  = trapmf(h0, [0 0 30 60]);             % 0.5
high = trapmf(h0, [40 70 100 100]);         % 0.1667

% قوة إطلاق القواعد (AND = min)
w1 = cold;                                  % R1: Cold            -> Slow
w2 = min(warm, low);                        % R2: Warm and Low    -> Medium
w3 = min(warm, high);                       % R3: Warm and High   -> Fast
w4 = hot;                                   % R4: Hot             -> Fast
fprintf('w = [%.4f  %.4f  %.4f  %.4f]\n', w1, w2, w3, w4);

% الاستنتاج (قص) والتجميع (max)
S = 0:100;                                  % 101 نقطة متل evalfis
slow   = min(w1,          trimf(S, [0 0 50]));
medium = min(w2,          trimf(S, [25 50 75]));
fast   = min(max(w3, w4), trimf(S, [50 100 100]));
agg    = max(max(slow, medium), fast);

% إزالة التضبيب (مركز الثقل)
speedManual = sum(S .* agg) / sum(agg);
fprintf('السرعة (يدوياً): %.2f %%\n', speedManual);

figure;
area(S, agg, 'FaceAlpha', 0.4); hold on; grid on;
xline(speedManual, 'r', 'LineWidth', 2);
xlabel('Fan speed (%)'); ylabel('\mu');
title(sprintf('المجموعة المجمّعة ومركز ثقلها = %.1f%%', speedManual));

%% 4. نفس النظام بـ Fuzzy Logic Toolbox
fis = mamfis('Name', 'fan');

fis = addInput(fis, [0 40], 'Name', 'temp');
fis = addMF(fis, 'temp', 'trapmf', [0 0 10 20],  'Name', 'Cold');
fis = addMF(fis, 'temp', 'trimf',  [10 20 30],   'Name', 'Warm');
fis = addMF(fis, 'temp', 'trapmf', [20 30 40 40], 'Name', 'Hot');

fis = addInput(fis, [0 100], 'Name', 'hum');
fis = addMF(fis, 'hum', 'trapmf', [0 0 30 60],     'Name', 'Low');
fis = addMF(fis, 'hum', 'trapmf', [40 70 100 100], 'Name', 'High');

fis = addOutput(fis, [0 100], 'Name', 'speed');
fis = addMF(fis, 'speed', 'trimf', [0 0 50],     'Name', 'Slow');
fis = addMF(fis, 'speed', 'trimf', [25 50 75],   'Name', 'Medium');
fis = addMF(fis, 'speed', 'trimf', [50 100 100], 'Name', 'Fast');

rules = [
    "If temp is Cold then speed is Slow"
    "If temp is Warm and hum is Low then speed is Medium"
    "If temp is Warm and hum is High then speed is Fast"
    "If temp is Hot then speed is Fast"
];
fis = addRule(fis, rules);

speedFis = evalfis(fis, [t0 h0]);
fprintf('السرعة (evalfis): %.2f %%\n', speedFis);

%% 5. الفحص البصري
figure; subplot(3,1,1); plotmf(fis, 'input', 1);  title('temp');
        subplot(3,1,2); plotmf(fis, 'input', 2);  title('hum');
        subplot(3,1,3); plotmf(fis, 'output', 1); title('speed');

showrule(fis)
figure; gensurf(fis);                       % سطح الخرج speed = f(temp, hum)
writeFIS(fis, 'fan');                       % حفظ بملف fan.fis
