%% الجلسة 5: ضبط المتحكم العائم Fuzzy-PD
%  النظام: G(s) = 1 / (s (0.5 s + 1))
%  يحتاج: Fuzzy Logic Toolbox (R2018b أو أحدث)
%  ملاحظة: التوابع المساعدة موجودة بآخر الملف (R2016b أو أحدث)
clc; clear; close all;

fis3 = buildFuzzyPD(3);     % 3 مجموعات لكل مدخل، 5 للخرج (متل الجلسة 4)
fis5 = buildFuzzyPD(5);     % 5 مجموعات لكل مدخل، 7 للخرج

%% 1. أثر Ku
figure; hold on; grid on;
for Ku = [2 4 8]
    [t, Y, U] = simFuzzyPD(fis3, 1, 0.3, Ku, 10);
    S = stepinfo(Y, t, 1);
    fprintf('Ku = %-4g  OS = %5.2f %%  Ts = %5.2f s  |u|max = %.2f\n', ...
        Ku, S.Overshoot, S.SettlingTime, max(abs(U)));
    plot(t, Y, 'LineWidth', 1.5, 'DisplayName', sprintf('K_u = %g', Ku));
end
legend show; xlabel('Time (s)'); ylabel('y'); title('أثر K_u');

%% 2. أثر Kd
figure; hold on; grid on;
for Kd = [0.1 0.3 0.6]
    [t, Y] = simFuzzyPD(fis3, 1, Kd, 4, 10);
    S = stepinfo(Y, t, 1);
    fprintf('Kd = %-4g  OS = %5.2f %%  Ts = %5.2f s\n', Kd, S.Overshoot, S.SettlingTime);
    plot(t, Y, 'LineWidth', 1.5, 'DisplayName', sprintf('K_d = %g', Kd));
end
legend show; xlabel('Time (s)'); ylabel('y'); title('أثر K_d');

%% 3. أثر Ke
figure; hold on; grid on;
for Ke = [0.5 1 2]
    [t, Y] = simFuzzyPD(fis3, Ke, 0.3, 4, 10);
    S = stepinfo(Y, t, 1);
    fprintf('Ke = %-4g  OS = %5.2f %%  Ts = %5.2f s\n', Ke, S.Overshoot, S.SettlingTime);
    plot(t, Y, 'LineWidth', 1.5, 'DisplayName', sprintf('K_e = %g', Ke));
end
legend show; xlabel('Time (s)'); ylabel('y'); title('أثر K_e');

%% 4. عدد دوال الانتماء: 3 مقابل 5
figure;
subplot(1,2,1); gensurf(fis3); title('3 MFs');
subplot(1,2,2); gensurf(fis5); title('5 MFs');

[t, Y3] = simFuzzyPD(fis3, 1, 0.3, 4, 10);
[~, Y5] = simFuzzyPD(fis5, 1, 0.3, 4, 10);
figure; plot(t, Y3, t, Y5, '--', 'LineWidth', 1.5); grid on;
legend('3 MFs', '5 MFs'); xlabel('Time (s)'); ylabel('y');

% مقطع من السطح على الخط de = 0
e = linspace(-1, 1, 41);
u3 = evalfis(fis3, [e' zeros(41,1)]);
u5 = evalfis(fis5, [e' zeros(41,1)]);
figure; plot(e, u3, e, u5, '--', e, 0.5*e, ':', 'LineWidth', 1.5); grid on;
legend('3 MFs', '5 MFs', 'خطي 0.5 e'); xlabel('e'); ylabel('u'); title('u(e, 0)');

%% 5. التحدي: OS < 2%، Ts < 1.3 s، |u| <= 5
% جرّب بنفسك قبل ما تشغّل هالقسم
cases = {fis3, 1.5, 0.4, 7, '3 MFs'; fis5, 1, 0.3, 6, '5 MFs'};
for c = 1:2
    [t, Y, U] = simFuzzyPD(cases{c,1}, cases{c,2}, cases{c,3}, cases{c,4}, 10);
    S = stepinfo(Y, t, 1);
    fprintf('التحدي (%s): OS = %.2f %%  Ts = %.2f s  |u|max = %.2f\n', ...
        cases{c,5}, S.Overshoot, S.SettlingTime, max(abs(U)));
end

%% ===================== توابع مساعدة =====================
function fis = buildFuzzyPD(nIn)
% بناء متحكم Fuzzy-PD بـ nIn مجموعة لكل مدخل (3 أو 5)، و nIn+2 مجموعة للخرج
    nOut = nIn + 2;
    names = {'NB','NM','NS','Z','PS','PM','PB'};
    if nIn == 3, inNames = {'N','Z','P'}; else, inNames = {'NB','NS','Z','PS','PB'}; end
    if nOut == 5, outNames = names([1 3 4 5 7]); else, outNames = names; end

    fis = mamfis('Name', sprintf('fuzzyPD%d', nIn));
    w = 2 / (nIn - 1);                                  % المسافة بين المراكز
    for v = ["e" "de"]
        fis = addInput(fis, [-1 1], 'Name', v);
        for k = 1:nIn
            c = -1 + (k-1)*w;
            fis = addMF(fis, v, 'trimf', [c-w c c+w], 'Name', inNames{k});
        end
    end
    fis = addOutput(fis, [-1 1], 'Name', 'u');
    w = 2 / (nOut - 1);
    for k = 1:nOut
        c = -1 + (k-1)*w;
        fis = addMF(fis, 'u', 'trimf', [c-w c c+w], 'Name', outNames{k});
    end

    % جدول القواعد: خرج = (ترتيب e + ترتيب de)، مع تقييده لأطراف الخرج
    ci = (nIn + 1) / 2;  co = (nOut + 1) / 2;
    rules = zeros(nIn^2, 5);  r = 0;
    for i = 1:nIn
        for j = 1:nIn
            r = r + 1;
            o = min(max((i - ci) + (j - ci), -(co - 1)), co - 1) + co;
            rules(r, :) = [i j o 1 1];                  % [e de u الوزن AND]
        end
    end
    fis = addRule(fis, rules);
end

function [t, Y, U] = simFuzzyPD(fis, Ke, Kd, Ku, Tend)
% محاكاة الحلقة المغلقة مع G(s) = 1/(s(0.5s+1)) بطريقة أويلر، ودخل مرجعي r = 1
    dt = 0.01; t = 0:dt:Tend; r = 1;
    y = 0; yd = 0; e_prev = r - y;
    Y = zeros(size(t)); U = Y;
    for k = 1:numel(t)
        e  = r - y;
        de = (e - e_prev) / dt;  e_prev = e;
        in = min(max([Ke*e, Kd*de], -1), 1);
        u  = Ku * evalfis(fis, in);
        ydd = 2 * (u - yd);
        yd  = yd + ydd*dt;
        y   = y  + yd*dt;
        Y(k) = y; U(k) = u;
    end
end
