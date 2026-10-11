%% الجلسة 3: المنطق العائم ببساطة (مثال المروحة)
%  يحتاج: Fuzzy Logic Toolbox (R2018b أو أحدث)
%  شغّل كل قسم لحاله بـ Run Section
clc; clear; close all;

%% 1. دوال الانتماء للحرارة
T = 0:0.1:40;
cold = trapmf(T, [0 0 10 20]);         % بارد
warm = trimf(T,  [10 20 30]);          % معتدل
hot  = trapmf(T, [20 30 40 40]);       % حار

figure;
plot(T, cold, T, warm, T, hot, 'LineWidth', 2); grid on;
legend('Cold', 'Warm', 'Hot'); xlabel('Temperature'); ylabel('درجة الانتماء');

% درجة انتماء 24 درجة
trimf(24, [10 20 30])                  % معتدل: 0.6
trapmf(24, [20 30 40 40])              % حار:   0.4

%% 2. نظام المروحة بمدخل واحد
fis = mamfis('Name', 'fan');

fis = addInput(fis, [0 40], 'Name', 'temp');
fis = addMF(fis, 'temp', 'trapmf', [0 0 10 20],   'Name', 'Cold');
fis = addMF(fis, 'temp', 'trimf',  [10 20 30],    'Name', 'Warm');
fis = addMF(fis, 'temp', 'trapmf', [20 30 40 40], 'Name', 'Hot');

fis = addOutput(fis, [0 100], 'Name', 'speed');
fis = addMF(fis, 'speed', 'trimf', [0 0 50],     'Name', 'Slow');
fis = addMF(fis, 'speed', 'trimf', [25 50 75],   'Name', 'Medium');
fis = addMF(fis, 'speed', 'trimf', [50 100 100], 'Name', 'Fast');

rules = [
    "If temp is Cold then speed is Slow"
    "If temp is Warm then speed is Medium"
    "If temp is Hot then speed is Fast"
];
fis = addRule(fis, rules);

%% 3. جرّب النظام
evalfis(fis, 24)          % حوالي 62.9
evalfis(fis, 5)           % حوالي 16.3
evalfis(fis, 35)          % حوالي 83.7

%% 4. من جوّا: نافذة القواعد
ruleview(fis)

%% 5. منحني القرار
figure; gensurf(fis); grid on;

%% 6. زيادة: مدخل تاني (الرطوبة)
fis = addInput(fis, [0 100], 'Name', 'hum');
fis = addMF(fis, 'hum', 'trapmf', [0 0 30 60],     'Name', 'Low');
fis = addMF(fis, 'hum', 'trapmf', [40 70 100 100], 'Name', 'High');

fis.Rules = [];
rules = [
    "If temp is Cold then speed is Slow"
    "If temp is Warm and hum is Low then speed is Medium"
    "If temp is Warm and hum is High then speed is Fast"
    "If temp is Hot then speed is Fast"
];
fis = addRule(fis, rules);

evalfis(fis, [24 45])     % حوالي 63.8
figure; gensurf(fis);
