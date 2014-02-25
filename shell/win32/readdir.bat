::title readdir.bat

@echo off 
if "%1" == "h" goto begin 
::mshta vbscript:createobject("wscript.shell").run("%~nx0 h",0)(window.close)&&exit 
mshta vbscript:createobject("wscript.shell").run("cmd /c %~nx0 h",0,TRUE)(window.close)&&exit 
:begin


set readPath=%1
set fromTime=%2
set tempFile=%3
::del /p/f  %tempFile%
echo _BEGIN_ > %tempFile%
::echo %readPath% %fromTime% %tempFile%
for /R %readPath% %%s in (.,*) do (
	if not "%%s"=="%%~fs" ( 
		echo %%~fs >> %tempFile% 
	)

	if "%%s"=="%%~fs" (
		if "%%~ts" lss "%fromTime%" (
			echo %%~fs_ >> %tempFile%
		)
	) 
)
echo _END_ >> %tempFile%