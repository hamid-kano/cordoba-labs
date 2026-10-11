%% الجلسة 6: Sugeno ومتحكم Fuzzy-PID
%  النظام: G(s) = 1 / (s (0.5 s + 1))، مع اضطراب على دخل النظام
%  يحتاج: Fuzzy Logic Toolbox (R2018b أو أحدث)
%  ملاحظة: التوابع المساعدة موجودة بآخر الملف
clc; clear; close all;

%% 1. متحكم Mamdani (نفس الجلسة 4)
mam = mamfis('Name', 'fuzzyPD_mamdani');
mam = addFuzzyInputs(mam);
mam = addOutput(mam, [-1 1], 'Name', 'u');
mam = addMF(mam, 'u', 'trimf', [-1.5 -1   -0.5], 'Name', 'NB');
mam = addMF(mam, 'u', 'trimf', [-1   -0.5  0  ], 'Name', 'NS');
mam = addMF(mam, 'u', 'trimf', [-0.5  0    0.5], 'Name', 'Z');
mam = addMF(mam, 'u', 'trimf', [ 0    0.5  1  ], 'Name', 'PS');
mam = addMF(mam, 'u', 'trimf', [ 0.5  1    1.5], 'Name', 'PB');
mam = addRule(mam, ruleTable());

%% 2. نفس المتحكم بنوع Sugeno: كل مجموعة خرج صارت رقم ثابت
sug = sugfis('Name', 'fuzzyPD_sugeno');
sug = addFuzzyInputs(sug);
sug = addOutput(sug, [-1 1], 'Name', 'u');
sug = addMF(sug, 'u', 'constant', -1,   'Name', 'NB');
sug = addMF(sug, 'u', 'constant', -0.5, 'Name', 'NS');
sug = addMF(sug, 'u', 'constant',  0,   'Name', 'Z');
sug = addMF(sug, 'u', 'constant',  0.5, 'Name', 'PS');
sug = addMF(sug, 'u', 'constant',  1,   'Name', 'PB');
sug = addRule(sug, ruleTable());

%% 3. مقارنة الخرج والسطح والسرعة
pts = [0.5 -0.2; 0.3 0.3; 1 1; -0.7 0.2];
disp(table(pts, evalfis(mam, pts), evalfis(sug, pts), ...
    'VariableNames', {'input', 'Mamdani', 'Sugeno'}));

figure;
subplot(1,2,1); gensurf(mam); title('Mamdani');
subplot(1,2,2); gensurf(sug); title('Sugeno');

x = 2*rand(1000, 2) - 1;
fprintf('زمن 1000 تقييم: Mamdani = %.4f s، Sugeno = %.4f s\n', ...
    timeit(@() evalfis(mam, x)), timeit(@() evalfis(sug, x)));

%% 4. استجابة الخطوة للنوعين (بدون اضطراب)
[t, Ym] = simFuzzyPID(mam, 1, 0.3, 4, 0, 0, 0, 10);
[~, Ys] = simFuzzyPID(sug, 1, 0.3, 4, 0, 0, 0, 10);
Sm = stepinfo(Ym, t, 1); Ss = stepinfo(Ys, t, 1);
fprintf('Mamdani: OS = %.2f %%  Ts = %.2f s\n', Sm.Overshoot, Sm.SettlingTime);
fprintf('Sugeno : OS = %.2f %%  Ts = %.2f s\n', Ss.Overshoot, Ss.SettlingTime);
figure; plot(t, Ym, t, Ys, '--', 'LineWidth', 1.5); grid on;
legend('Mamdani', 'Sugeno'); xlabel('Time (s)'); ylabel('y');

%% 5. اضطراب 0.5 على دخل النظام عند t = 5: من PD لـ PID
%            fis  Ke  Kd   Ku  Ki  band  d    Tend   الاسم
cases = {   mam,  1,  0.3, 4,  0,  0,    0.5, 20,  'Fuzzy-PD'
            mam,  1,  0.3, 4,  1,  Inf,  0.5, 20,  'Fuzzy-PID (تكامل دائم)'
            mam,  1,  0.3, 4,  1,  0.3,  0.5, 20,  'Fuzzy-PID (تكامل مشروط |e|<0.3)'
            mam,  1,  0.3, 4,  1,  0.1,  0.5, 20,  'Fuzzy-PID (تكامل مشروط |e|<0.1)' };

figure; hold on; grid on;
for c = 1:size(cases, 1)
    [t, Y] = simFuzzyPID(cases{c, 1:8});
    pre = t < 5;
    S = stepinfo(Y(pre), t(pre), 1);
    fprintf('%-34s OS = %5.1f %%  ذروة بعد الاضطراب = %.3f  y(20) = %.3f\n', ...
        cases{c, 9}, S.Overshoot, max(Y(~pre)), Y(end));
    plot(t, Y, 'LineWidth', 1.5, 'DisplayName', cases{c, 9});
end
xline(5, ':', 'اضطراب'); legend show; xlabel('Time (s)'); ylabel('y');

%% ===================== توابع مساعدة =====================
function fis = addFuzzyInputs(fis)
% المدخلين e و de بـ 3 مجموعات لكل واحد (متل الجلسة 4)
    for v = ["e" "de"]
        fis = addInput(fis, [-1 1], 'Name', v);
        fis = addMF(fis, v, 'trimf', [-2 -1 0], 'Name', 'N');
        fis = addMF(fis, v, 'trimf', [-1  0 1], 'Name', 'Z');
        fis = addMF(fis, v, 'trimf', [ 0  1 2], 'Name', 'P');
    end
end

function rules = ruleTable()
% جدول القواعد 3x3: [e de u الوزن AND]
    rules = [1 1 1 1 1;  1 2 2 1 1;  1 3 3 1 1;
             2 1 2 1 1;  2 2 3 1 1;  2 3 4 1 1;
             3 1 3 1 1;  3 2 4 1 1;  3 3 5 1 1];
end

function [t, Y, U] = simFuzzyPID(fis, Ke, Kd, Ku, Ki, band, d, Tend)
% u = Ku*FIS(Ke e, Kd de) + Ki * ∫e dt
% التكامل بيشتغل بس لما |e| < band (band = Inf يعني تكامل دائم)
% d: اضطراب على دخل النظام بيبدأ عند t = 5
    dt = 0.01; t = 0:dt:Tend; r = 1;
    y = 0; yd = 0; e_prev = r - y; I = 0;
    Y = zeros(size(t)); U = Y;
    for k = 1:numel(t)
        e  = r - y;
        de = (e - e_prev) / dt;  e_prev = e;
        if abs(e) < band
            I = I + e*dt;
        end
        in = min(max([Ke*e, Kd*de], -1), 1);
        u  = Ku * evalfis(fis, in) + Ki * I;
        dist = d * (t(k) >= 5);
        ydd = 2 * (u + dist - yd);
        yd  = yd + ydd*dt;
        y   = y  + yd*dt;
        Y(k) = y; U(k) = u;
    end
end
