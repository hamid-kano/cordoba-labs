%% الجلسة 7: التحكم بمستوى خزان مياه
%  يحتاج: buildFuzzyPD.m بنفس المجلد
%  شغّل الملف كامل بـ Run. التوابع المساعدة بآخر الملف (ما لازم تعدّل فيها)
clc; clear; close all;

%% 1. الخزان والسيناريو (فيك تغيّر هالأرقام)
P.A    = 1;        % مساحة قاعدة الخزان (m^2)
P.qmax = 0.5;      % أقصى تدفق للمضخة (m^3/s)
P.T    = 300;      % زمن المحاكاة (s)
P.h0   = 1;        % المستوى بالبداية (m)
P.q0   = 0.2;      % تدفق المضخة بالبداية
P.ref  = @(t) 1 + 2*(t >= 10) - 1.5*(t >= 120);   % المطلوب: 1 ثم 3 ثم 1.5 متر
P.kout = @(t) 0.2 + 0.1*(t >= 220);               % فتح صمام التصريف أكتر عند t = 220

%% 2. المتحكمين
% PI عادي (Kp و Ki مصممين لما يكون المستوى 1 متر)
Kp = 0.38;  Ki = 0.09;
% المتحكم الضبابي: نفس متحكم الجلسة 4، بس بيقرر "قديش نزيد أو ننقّص" التدفق
fis = buildFuzzyPD(3);
Ke = 1;  Kd = 4;  Ku = 0.3;

%% 3. المحاكاة
R1 = simTank(P, @(e, de, s) piCtrl(e, s, Kp, Ki, false, P));
R2 = simTank(P, @(e, de, s) fuzzyCtrl(e, de, s, fis, Ke, Kd, Ku, P));

figure;
subplot(2,1,1); hold on; grid on;
plot(R1.t, R1.r, 'k:', 'LineWidth', 1.2);
plot(R1.t, R1.h, 'LineWidth', 1.5);
plot(R2.t, R2.h, 'LineWidth', 1.5);
xline(220, '--', 'فتح الصمام');
ylabel('مستوى المي h (m)'); legend('المطلوب', 'PI', 'Fuzzy');
subplot(2,1,2); hold on; grid on;
plot(R1.t, R1.q, 'LineWidth', 1.2);
plot(R2.t, R2.q, 'LineWidth', 1.2);
ylabel('تدفق المضخة q'); xlabel('Time (s)'); legend('PI', 'Fuzzy');

%% 4. الأرقام
printInfo('PI', R1);
printInfo('Fuzzy', R2);

%% 5. زيادة: PI مع حماية من حدود المضخة (Anti-windup)
R3 = simTank(P, @(e, de, s) piCtrl(e, s, Kp, Ki, true, P));
printInfo('PI + حماية', R3);

%% ===================== توابع مساعدة =====================
function R = simTank(P, ctrl)
    dt = 0.05;  t = 0:dt:P.T;  n = numel(t);
    h = P.h0;  e_prev = P.ref(0) - h;
    s = struct('I', P.q0, 'q', P.q0, 'dt', dt);
    R.t = t;  R.r = zeros(1,n);  R.h = zeros(1,n);  R.q = zeros(1,n);
    for k = 1:n
        r  = P.ref(t(k));
        e  = r - h;
        de = (e - e_prev) / dt;  e_prev = e;
        [q, s] = ctrl(e, de, s);
        q = min(max(q, 0), P.qmax);                         % حدود المضخة
        h = h + (q - P.kout(t(k))*sqrt(max(h, 0))) / P.A * dt;
        h = max(h, 0);
        R.r(k) = r;  R.h(k) = h;  R.q(k) = q;
    end
end

function [q, s] = piCtrl(e, s, Kp, Ki, antiWindup, P)
    u  = Kp*e + s.I;
    us = min(max(u, 0), P.qmax);
    if ~antiWindup || us == u || sign(e) ~= sign(u - us)
        s.I = s.I + Ki*e*s.dt;
    end
    q = u;
end

function [q, s] = fuzzyCtrl(e, de, s, fis, Ke, Kd, Ku, P)
    in  = min(max([Ke*e, Kd*de], -1), 1);
    s.q = s.q + Ku * evalfis(fis, in) * s.dt;    % منغيّر التدفق شوي شوي
    s.q = min(max(s.q, 0), P.qmax);
    q = s.q;
end

function printInfo(name, R)
    % التجاوز عند التعبئة (من 1 لـ 3) وعند التفريغ (من 3 لـ 1.5)، وأكبر انحراف بعد فتح الصمام
    up   = R.t >= 10  & R.t < 120;
    down = R.t >= 120 & R.t < 220;
    dist = R.t >= 220;
    osUp   = max(0, (max(R.h(up)) - 3) / 2 * 100);
    osDown = max(0, (1.5 - min(R.h(down))) / 1.5 * 100);
    dev    = max(abs(R.h(dist) - 1.5));
    fprintf('%-12s تجاوز التعبئة = %5.1f %%   تجاوز التفريغ = %5.1f %%   انحراف بعد الصمام = %.2f m\n', ...
        name, osUp, osDown, dev);
end
