#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void) {
    pid_t pid = fork();

    if (pid < 0) {
        perror("fork");
        exit(1);
    } else if (pid == 0) {
        printf("Child:  PID=%d, PPID=%d\n", getpid(), getppid());
        execlp("ls", "ls", "-l", NULL);
        perror("exec");          /* reached only if exec fails */
        exit(1);
    } else {
        int status;
        wait(&status);
        printf("Parent: PID=%d, child %d finished with code %d\n",
               getpid(), pid, WEXITSTATUS(status));
    }
    return 0;
}
