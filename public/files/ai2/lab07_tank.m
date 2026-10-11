%% الجلسة 7: التحكم بمستوى خزان مياه (نظام غير خطي)
%  النموذج: A dh/dt = q - k sqrt(h)،  المضخة: 0 <= q <= 0.5
%  يحتاج: Fuzzy Logic Toolbox (R2018b أو أحدث)
%  ملاحظة: التوابع المساعدة موجودة بآخر الملف
clc; clear; close all;

%% 1. معاملات الخزان والسيناريو
P.A = 1;            % مساحة مقطع الخزان (m^2)
P.qmax = 0.5;       % أقصى تدفق للمضخة (m^3/s)
P.dt = 0.05;        % خطوة المحاكاة (s)
P.T  = 300;         % زمن المحاكاة (s)
P.h0 = 1;  P.q0 = 0.2;                               % نقطة البداية (توازن عند k = 0.2)
P.ref  = @(t) 1 + 2*(t >= 10) - 1.5*(t >= 120);      % 1 ثم 3 ثم 1.5 متر
P.kout = @(t) 0.2 + 0.1*(t >= 220);                  % فتح صمام التصريف عند t = 220

%% 2. نموذج خطي حول h0 = 1 وتصميم PI
%  d(dh)/dt = dq - k/(2 sqrt(h0)) dh  =>  G(s) = 1 / (s + 0.1)
%  قطبين مطلوبين: zeta = 0.8، wn = 0.3
%  s^2 + (0.1 + Kp) s + Ki = s^2 + 2 zeta wn s + wn^2
Kp = 2*0.8*0.3 - 0.1;     % = 0.38
Ki = 0.3^2;               % = 0.09

%% 3. المتحكم العائم: نفس FIS تبع الجلسة 4، بس بشكل تزايدي
%  dq/dt = Ku * FIS(Ke e, Kd de)
fis = readfis('fuzzyPD');     % أو ابنيه بكود الجلسة 4
Ke = 1; Kd = 4; Ku = 0.3;

%% 4. المحاكاة
R1 = simTank(P, @(e, de, s) piCtrl(e, s, Kp, Ki, false, P));
R2 = simTank(P, @(e, de, s) piCtrl(e, s, Kp, Ki, true,  P));
R3 = simTank(P, @(e, de, s) fuzzyCtrl(e, de, s, fis, Ke, Kd, Ku, P));
names = {'PI', 'PI + Anti-windup', 'Fuzzy (تزايدي)'};
R = {R1, R2, R3};

figure;
subplot(2,1,1); hold on; grid on;
plot(R1.t, R1.r, 'k:', 'LineWidth', 1.2, 'DisplayName', 'المرجع');
for i = 1:3, plot(R{i}.t, R{i}.h, 'LineWidth', 1.4, 'DisplayName', names{i}); end
xline(220, '--', 'فتح الصمام'); ylabel('h (m)'); legend show;
subplot(2,1,2); hold on; grid on;
for i = 1:3, plot(R{i}.t, R{i}.q, 'LineWidth', 1.2); end
ylabel('q (m^3/s)'); xlabel('Time (s)'); legend(names);

%% 5. المقاييس
fprintf('%-18s | 1->3: OS    Ts    | 3->1.5: OS    Ts    | اضطراب: انحراف  رجوع\n', '');
for i = 1:3
    [os1, ts1] = segInfo(R{i}, 10, 120, 1, 3);
    [os2, ts2] = segInfo(R{i}, 120, 220, 3, 1.5);
    [dev, rec] = distInfo(R{i}, 220, 1.5);
    fprintf('%-18s | %5.1f%% %5.1fs     | %5.1f%% %5.1fs       | %.3f m  %5.1fs\n', ...
        names{i}, os1, ts1, os2, ts2, dev, rec);
end

%% ===================== توابع مساعدة =====================
function R = simTank(P, ctrl)
% محاكاة الخزان بطريقة أويلر. ctrl(e, de, state) بيرجع [q, state]
    t = 0:P.dt:P.T; n = numel(t);
    h = P.h0; e_prev = P.ref(0) - h;
    s = struct('I', P.q0, 'q', P.q0);           % حالة المتحكم
    R.t = t; R.r = zeros(1,n); R.h = zeros(1,n); R.q = zeros(1,n);
    for k = 1:n
        r  = P.ref(t(k));
        e  = r - h;
        de = (e - e_prev) / P.dt;  e_prev = e;
        [q, s] = ctrl(e, de, s);
        q = min(max(q, 0), P.qmax);             % حدود المضخة
        h = h + (q - P.kout(t(k))*sqrt(max(h, 0))) / P.A * P.dt;
        h = max(h, 0);
        R.r(k) = r; R.h(k) = h; R.q(k) = q;
    end
end

function [q, s] = piCtrl(e, s, Kp, Ki, antiWindup, P)
% PI عادي. s.I هو خرج الجزء التكاملي (Ki * ∫e) ويبدأ من q0
    u  = Kp*e + s.I;
    us = min(max(u, 0), P.qmax);
    % Anti-windup بالتقييد: وقّف التكامل إذا المضخة مشبّعة والخطأ عم يزيد الإشباع
    if ~antiWindup || us == u || sign(e) ~= sign(u - us)
        s.I = s.I + Ki*e*P.dt;
    end
    q = u;
end

function [q, s] = fuzzyCtrl(e, de, s, fis, Ke, Kd, Ku, P)
% Fuzzy تزايدي: الـ FIS بيقرر قديش نغيّر التدفق، والتدفق نفسه مقيّد بحدود المضخة
    in = min(max([Ke*e, Kd*de], -1), 1);
    s.q = s.q + Ku * evalfis(fis, in) * P.dt;
    s.q = min(max(s.q, 0), P.qmax);
    q = s.q;
end

function [os, ts] = segInfo(R, t0, t1, r0, r1)
% التجاوز وزمن الاستقرار (2%) لتغيير المرجع من r0 لـ r1 بين t0 و t1
    idx = R.t >= t0 & R.t < t1;  t = R.t(idx);  h = R.h(idx);
    amp = r1 - r0;
    os = max(0, max((h - r1) / amp * 100));
    out = find(abs(h - r1) > 0.02*abs(amp), 1, 'last');
    if isempty(out), ts = 0; else, ts = t(out) - t0; end
end

function [dev, rec] = distInfo(R, t0, r)
% أكبر انحراف بعد الاضطراب، والزمن لحتى يرجع المستوى ضمن 2%
    idx = R.t >= t0;  t = R.t(idx);  h = R.h(idx);
    dev = max(abs(h - r));
    out = find(abs(h - r) > 0.02*r, 1, 'last');
    if isempty(out), rec = 0; else, rec = t(out) - t0; end
end
