%% الجلسة 3: تصميم متحكم Fuzzy-PD ومقارنته مع PD
%  النظام: G(s) = 1 / (s (0.5 s + 1))
%  يحتاج: Fuzzy Logic Toolbox (R2018b أو أحدث) و Control System Toolbox
clc; clear; close all;

%% 1. بناء نظام الاستدلال العائم
fis = mamfis('Name', 'fuzzyPD');

fis = addInput(fis, [-1 1], 'Name', 'e');
fis = addMF(fis, 'e', 'trimf', [-2 -1 0], 'Name', 'N');
fis = addMF(fis, 'e', 'trimf', [-1  0 1], 'Name', 'Z');
fis = addMF(fis, 'e', 'trimf', [ 0  1 2], 'Name', 'P');

fis = addInput(fis, [-1 1], 'Name', 'de');
fis = addMF(fis, 'de', 'trimf', [-2 -1 0], 'Name', 'N');
fis = addMF(fis, 'de', 'trimf', [-1  0 1], 'Name', 'Z');
fis = addMF(fis, 'de', 'trimf', [ 0  1 2], 'Name', 'P');

fis = addOutput(fis, [-1 1], 'Name', 'u');
fis = addMF(fis, 'u', 'trimf', [-1.5 -1   -0.5], 'Name', 'NB');
fis = addMF(fis, 'u', 'trimf', [-1   -0.5  0  ], 'Name', 'NS');
fis = addMF(fis, 'u', 'trimf', [-0.5  0    0.5], 'Name', 'Z');
fis = addMF(fis, 'u', 'trimf', [ 0    0.5  1  ], 'Name', 'PS');
fis = addMF(fis, 'u', 'trimf', [ 0.5  1    1.5], 'Name', 'PB');

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
writeFIS(fis, 'fuzzyPD');

%% 2. فحص التصميم
figure('Name', 'Membership functions');
subplot(3,1,1); plotmf(fis, 'input', 1);  title('e');
subplot(3,1,2); plotmf(fis, 'input', 2);  title('de');
subplot(3,1,3); plotmf(fis, 'output', 1); title('u');
showrule(fis)
figure('Name', 'Control surface'); gensurf(fis);

%% 3. محاكاة الحلقة المغلقة (أويلر)
Ke = 1; Kd = 0.3; Ku = 4;
dt = 0.01; t = 0:dt:10; r = 1;
y = 0; yd = 0; e_prev = r - y;
Y = zeros(size(t)); U = Y;

for k = 1:numel(t)
    e  = r - y;
    de = (e - e_prev) / dt;  e_prev = e;
    in = min(max([Ke*e, Kd*de], -1), 1);
    u  = Ku * evalfis(fis, in);

    ydd = 2 * (u - yd);            % 0.5*y'' + y' = u
    yd  = yd + ydd*dt;
    y   = y  + yd*dt;
    Y(k) = y; U(k) = u;
end

%% 4. المقارنة مع PD
s = tf('s'); G = 1/(s*(0.5*s+1));
C = pidtune(G, 'PD');
ypid = step(feedback(C*G, 1), t);

figure('Name', 'Comparison');
subplot(2,1,1);
plot(t, Y, t, ypid, '--', 'LineWidth', 1.5); grid on;
legend('Fuzzy-PD', 'PD (pidtune)', 'Location', 'southeast'); ylabel('y');
subplot(2,1,2);
plot(t, U, 'LineWidth', 1.5); grid on; ylabel('u (Fuzzy)'); xlabel('Time (s)');

fprintf('Fuzzy-PD:\n'); disp(stepinfo(Y, t, r));
fprintf('PD:\n');       disp(stepinfo(ypid, t, r));
