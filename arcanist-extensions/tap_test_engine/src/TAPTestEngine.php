<?php

final class TAPTestEngine extends ArcanistUnitTestEngine {

  public function run() {
    $command = $this->getConfigurationManager()->getConfigFromAnySource('unit.engine.tap.command');

    $future = new ExecFuture($command);

    do {
      list($stdout, $stderr) = $future->read();
      echo $stdout;
      echo $stderr;
      sleep(0.5);
    } while (!$future->isReady());

    list($error, $stdout, $stderr) = $future->resolve();
    return $this->parseOutput($stdout);
  }

  public function shouldEchoTestResults() {
    return true;
  }

  public function readCoverage($cover_file) {
    $coverage_dom = new DOMDocument();
    $coverage_dom->loadXML(Filesystem::readFile($cover_file));
    $modified = $this->getPaths();
    $reports = array();
    $classes = $coverage_dom->getElementsByTagName("class");
    foreach ($classes as $class) {
      $path = $class->getAttribute("filename");
      $root = $this->getWorkingCopy()->getProjectRoot();
      if (in_array($path, $modified) === false) {
        continue;
      }
      if (!Filesystem::isDescendant($path, $root)) {
        continue;
      }
      // get total line count in file
      $line_count = count(phutil_split_lines(Filesystem::readFile($path)));
      $coverage = "";
      $start_line = 1;
      $lines = $this->unitTestEngineGetLines($class);
      for ($ii = 0; $ii < count($lines); $ii++) {
        $line = $lines[$ii];
        $next_line = $line["number"];
        for ($start_line; $start_line < $next_line; $start_line++) {
          $coverage .= "N";
        }
        if ($line["hits"] === 0) {
          $coverage .= "U";
        } else if ($line["hits"] > 0) {
          $coverage .= "C";
        }
        $start_line++;
      }
      if ($start_line < $line_count) {
        foreach (range($start_line, $line_count) as $line_num) {
          $coverage .= "N";
        }
      }
      $reports[$path] = $coverage;
    }
    return $reports;
  }
  
  private function unitTestEngineGetLines($class) {
    $lines = $class->getElementsByTagName('line');
    $result = array();
    for ($i = 0; $i < $lines->length; $i++) {
      $item = $lines->item($i);
      $line_info = array(
        'number' => intval($item->getAttribute('number')),
        'hits' => intval($item->getAttribute('hits')),
      );
      array_push($result, $line_info);
    }
    usort($result, array($this, 'unitTestEngineSortLines'));
    return $result;
  }

  private function unitTestEngineSortLines($a, $b) {
      $a_number = $a['number'];
      $b_number = $b['number'];
      if ($a_number === $b_number) {
          return 0;
      }
      return ($a_number < $b_number) ? -1 : 1;
  }

  private function parseOutput($output) {
    $results = array();
    $lines = explode(PHP_EOL, $output);

    foreach($lines as $index => $line) {

      preg_match('/Can not load \"\w+\", it is not registered/', $line, $missing_plugin);
      
      if (count($missing_plugin) > 0) {
        $result = new ArcanistUnitTestResult();
        $result->setName($missing_plugin[0]);
        $result->setResult(ArcanistUnitTestResult::RESULT_FAIL);
        $result->setUserData($line);
        $results[] = $result;
      }

      preg_match('/Executed \d+ of \d+ DISCONNECTED/', $line, $disconnected);

      if (count($disconnected) > 0) {
        $result = new ArcanistUnitTestResult();
        $result->setName($line);
        $result->setResult(ArcanistUnitTestResult::RESULT_SKIP);
        $result->setUserData($line);
        $results[] = $result;
      }

      preg_match('/Executed \d+ of \d+ SUCCESS/', $line, $success);

      if (count($success) > 0) {
        $result = new ArcanistUnitTestResult();
        $working_copy = $this->getWorkingCopy();
        $project_root = $working_copy->getProjectRoot();
        //$coverage = $this->readCoverage($project_root . '/coverage/cobertura-coverage.xml');
        $result->setName($line);
        $result->setResult(ArcanistUnitTestResult::RESULT_PASS);
        //$result->setCoverage($coverage);
        $result->setUserData($line);
        $results[] = $result;
      }

      preg_match('/\((\d+) (FAILED)\)/', $line, $fails);
      
      if ((count($fails) > 2) and ($fails[2] == 'FAILED')) {
        $result = new ArcanistUnitTestResult();
        $result->setName($line);
        $result->setResult(ArcanistUnitTestResult::RESULT_FAIL);
        $result->setUserData($line);
        $results[] = $result;
      }

    }

    return $results;
  }
}
