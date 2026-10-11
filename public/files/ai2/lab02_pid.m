%% الجلسة 2: ضبط PID وتشغيل نموذج Simulink
clc; clear; close all;

s = tf('s');
G = 1 / (s*(0.5*s + 1));

%% الضبط التلقائي
C = pidtune(G, 'PID')
Kp = C.Kp; Ki = C.Ki; Kd = C.Kd;
T = feedback(C*G, 1);
figure; step(T); grid on; title('PID (pidtune)');
stepinfo(T)

%% تشغيل النموذج (لازم يكون lab02_pid.slx بنفس المجلد،
%% وبلوك PID فيه Kp و Ki و Kd كمتغيرات)
if exist('lab02_pid.slx', 'file')
    out = sim('lab02_pid');
    figure; plot(out.y.Time, out.y.Data, 'LineWidth', 1.5);
    grid on; xlabel('Time (s)'); ylabel('y(t)'); title('Simulink: PID');
end
