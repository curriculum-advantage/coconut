# Coconut

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.18] - 2021-04-05
* Add support for updating stroke after ImageLabel have been generated

## [2.1.17] - 2021-04-01
* Add support for setting font and background color to ImageLabel
* Add ability to set ImageLabel position after creation
* Add ability to enable text shadow to ImageLabel
* Add the ability to update ImageLabel Dimension
* Add the ability to add a ClickHandler to ImageLabel
* Add the ability to disable ClickHandler on MultiLabel
* MultiLabel now pass the MultiLabel instance to the ClickHandler 
* MultiLabel now directly create math symbols

## [2.1.8] - 2021-03-26
* Update MultiLabel to use js private encapsulation rather than constructor encapsulation.
* Adding text attribute to MultiLabel constructor, so you no longer have to manually call `setString` 
* MultiLabel and ImageLabel can be created with or without the `new` keyword.

## [2.0.0] - 2021-02-22
* Images will be generated using the dom in place of using cc.Label in order to work around poor drivers on certain 
low-cost Lenovo Chromebooks.
* createLabel was replaced with ImageLabel().

## [Unreleased]

## [1.0.2] - 2019-10-02

### Fixed

* Fix audioManager type errors.

## [1.0.1] - 2019-10-02

### Fixed

* Fix IntelliSense for projects using this package.
* Update package to only include build files.
* Fix type errors.

## [1.0.0] - 2019-09-30

* Initial release
