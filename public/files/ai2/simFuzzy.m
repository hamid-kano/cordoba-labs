function [t, y, u] = simFuzzy(fis, Ke, Kd, Ku, varargin)
%SIMFUZZY محاكاة حلقة تحكم مغلقة بمتحكم ضبابي (Fuzzy)
%
%   simFuzzy(fis, Ke, Kd, Ku)
%       بيحاكي وبيرسم الخرج y وإشارة التحكم u، وبيطبع النتائج.
%
%   [t, y, u] = simFuzzy(fis, Ke, Kd, Ku)
%       بيرجع الزمن t والخرج y وإشارة التحكم u بدون رسم.
%
%   فيك تضيف أي خيار من هدول بعد Ku (كلهن اختياريين):
%       'Plant'        النظام (tf)                       الافتراضي: 1/(s(0.5s+1))
%       'Time'         زمن المحاكاة بالثواني              10
%       'Reference'    القيمة المطلوبة                    1
%       'Ki'           ربح التكامل (لإلغاء الخطأ المستقر)  0  يعني بدون تكامل
%       'Disturbance'  اضطراب بينضاف على دخل النظام       0
%       'DistTime'     وقت بداية الاضطراب                 5
%       'Limits'       حدود إشارة التحكم [أصغر أكبر]       [-Inf Inf]
%
%   أمثلة:
%       simFuzzy(fis, 1, 0.3, 4)
%       simFuzzy(fis, 1, 0.3, 4, 'Ki', 1, 'Disturbance', 0.5, 'Time', 20)
%       simFuzzy(fis, 1, 0.5, 8, 'Plant', tf(1, [1 1 0]), 'Limits', [-5 5])
%
%   المتحكم:  u = Ku * FIS(Ke*e, Kd*de) + Ki * (تكامل e)
%   التكامل بيشتغل بس لما يكون الخطأ صغير (|Ke*e| < 0.5) لحتى ما يعمل تجاوز كبير.

    p = inputParser;
    addParameter(p, 'Plant', tf(1, [0.5 1 0]));
    addParameter(p, 'Time', 10);
    addParameter(p, 'Reference', 1);
    addParameter(p, 'Ki', 0);
    addParameter(p, 'Disturbance', 0);
    addParameter(p, 'DistTime', 5);
    addParameter(p, 'Limits', [-Inf Inf]);
    addParameter(p, 'Band', 0.5);
    parse(p, varargin{:});
    o = p.Results;

    sys = ss(o.Plant);
    A = sys.A; B = sys.B; C = sys.C;
    if any(sys.D ~= 0)
        error('simFuzzy: النظام لازم يكون فيه أقطاب أكتر من الأصفار (D = 0).');
    end

    dt = 0.01;
    t  = 0:dt:o.Time;
    r  = o.Reference;
    x  = zeros(size(A, 1), 1);
    yk = C*x;  e_prev = r - yk;  I = 0;
    y  = zeros(size(t));  u = y;

    for k = 1:numel(t)
        e  = r - yk;
        de = (e - e_prev) / dt;  e_prev = e;
        if o.Ki ~= 0 && abs(Ke*e) < o.Band
            I = I + e*dt;
        end
        in = min(max([Ke*e, Kd*de], -1), 1);           % المدخلات ضمن [-1, 1]
        uk = Ku * evalfis(fis, in) + o.Ki * I;
        uk = min(max(uk, o.Limits(1)), o.Limits(2));    % حدود المشغّل
        d  = o.Disturbance * (t(k) >= o.DistTime);
        x  = x + (A*x + B*(uk + d)) * dt;               % طريقة أويلر
        yk = C*x;
        y(k) = yk;  u(k) = uk;
    end

    if nargout == 0
        figure;
        subplot(2,1,1);
        plot(t, y, 'LineWidth', 1.5); hold on;
        plot(t, r*ones(size(t)), 'k:'); grid on;
        ylabel('y (الخرج)');
        title(sprintf('Ke = %g,  Kd = %g,  Ku = %g,  Ki = %g', Ke, Kd, Ku, o.Ki));
        subplot(2,1,2);
        plot(t, u, 'LineWidth', 1.2); grid on;
        ylabel('u (إشارة التحكم)'); xlabel('Time (s)');

        S = stepinfo(y, t, r);
        fprintf('التجاوز = %.1f %%   زمن الاستقرار = %.2f s   القيمة النهائية = %.3f   أكبر |u| = %.2f\n', ...
            S.Overshoot, S.SettlingTime, y(end), max(abs(u)));
        clear t y u
    end
end
